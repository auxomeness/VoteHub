from datetime import timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.candidate import Candidate
from app.models.college import College
from app.models.election import VotingEvent
from app.models.eligibility import ElectionEligibility
from app.models.organization import Organization
from app.models.position import Position
from app.models.user import User
from app.models.vote import VoteDetail, VoteRecord
from app.security import get_password_hash
from app.utils.datetime import utcnow
from app.utils.enums import (
    CandidateStatus,
    ElectionStatus,
    ElectionType,
    EligibilityType,
    PositionScope,
    RecordStatus,
    ResultVisibility,
    UserRole,
    UserStatus,
)


COLLEGES = [
    ("College of Business and Accountancy", "CBA"),
    ("College of Computer Studies", "CCS"),
    ("College of Education", "CED"),
    ("College of Humanities and Social Sciences", "CHSS"),
    ("College of Science, Engineering, and Architecture", "CSEA"),
    ("College of Nursing", "CON"),
    ("College of Law", "COL"),
]

ORGANIZATIONS = [
    ("CSS", "Computer Studies Society"),
    ("JPCS", "Junior Philippine Computer Society"),
    ("PIXEL", "Photography and Digital Arts Organization"),
    ("ThePILLARS", "ThePILLARS Publication"),
    ("Remontados Debate Society", "Debate society"),
    ("LEAP", "Leadership and empowerment organization"),
    ("GABAY", "Guidance and advocacy organization"),
    ("TACTICS", "Tactical studies organization"),
]


def _college(db: Session, abbreviation: str) -> College:
    return db.scalar(select(College).where(College.abbreviation == abbreviation))


def _org(db: Session, name: str) -> Organization | None:
    return db.scalar(select(Organization).where(Organization.name == name))


def _seed_reference_data(db: Session) -> None:
    for name, abbreviation in COLLEGES:
        if _college(db, abbreviation) is None:
            db.add(College(name=name, abbreviation=abbreviation, status=RecordStatus.ACTIVE))
    for name, description in ORGANIZATIONS:
        if _org(db, name) is None:
            db.add(Organization(name=name, description=description, status=RecordStatus.ACTIVE))
    db.flush()


def _add_user(
    db: Session,
    *,
    student_number: str,
    first_name: str,
    last_name: str,
    email: str,
    password: str,
    college: str,
    organization: str | None = None,
    year_level: str = "4th Year",
    program: str = "Bachelor of Science in Computer Science",
    role: UserRole = UserRole.STUDENT,
    status: UserStatus = UserStatus.ACTIVE,
) -> User:
    existing = db.scalar(select(User).where(User.email == email.lower()))
    if existing:
        return existing
    user = User(
        student_number=student_number,
        first_name=first_name,
        last_name=last_name,
        email=email.lower(),
        password_hash=get_password_hash(password),
        college_id=_college(db, college).id,
        organization_id=_org(db, organization).id if organization else None,
        year_level=year_level,
        program=program,
        role=role,
        status=status,
    )
    db.add(user)
    db.flush()
    return user


def _add_position(
    db: Session,
    event: VotingEvent,
    name: str,
    order: int,
    candidates: list[tuple[str, str, str | None, str]],
    *,
    college: str | None = None,
) -> Position:
    position = Position(
        event_id=event.id,
        name=name,
        position_scope=PositionScope.COLLEGE if college else PositionScope.UNIVERSITY,
        college_id=_college(db, college).id if college else None,
        max_selection=1,
        display_order=order,
    )
    db.add(position)
    db.flush()
    for candidate_name, candidate_college, org_name, platform in candidates:
        db.add(
            Candidate(
                position_id=position.id,
                name=candidate_name,
                college_id=_college(db, candidate_college).id,
                organization_id=_org(db, org_name).id if org_name else None,
                platform=platform,
                biography="Seeded candidate profile for VoteHub development.",
                status=CandidateStatus.ACTIVE,
            )
        )
    return position


def _add_vote(db: Session, user: User, event: VotingEvent, offset_hours: int = 1) -> None:
    existing = db.scalar(select(VoteRecord).where(VoteRecord.user_id == user.id, VoteRecord.event_id == event.id))
    if existing:
        return
    vote = VoteRecord(user_id=user.id, event_id=event.id, submitted_at=event.start_date + timedelta(hours=offset_hours))
    db.add(vote)
    db.flush()
    for index, position in enumerate(event.positions):
        candidates = sorted(position.candidates, key=lambda item: item.id)
        if not candidates:
            continue
        candidate = candidates[(user.id + index) % len(candidates)]
        db.add(VoteDetail(vote_id=vote.id, position_id=position.id, candidate_id=candidate.id, is_abstain=False))


def _seed_users(db: Session) -> list[User]:
    admin = _add_user(
        db,
        student_number="ADMIN-001",
        first_name="VoteHub",
        last_name="Admin",
        email="admin@adnu.edu.ph",
        password="admin12345",
        college="CCS",
        role=UserRole.ADMIN,
    )
    maria = _add_user(
        db,
        student_number="2021-00456",
        first_name="Maria",
        last_name="Santos",
        email="maria.santos@gbox.adnu.edu.ph",
        password="password123",
        college="CCS",
        organization="JPCS",
        year_level="4th Year",
    )
    students = [maria]
    samples = [
        ("2022-00001", "Carlo", "Reyes", "carlo.reyes@gbox.adnu.edu.ph", "CCS", "CSS", "3rd Year"),
        ("2022-00002", "Angela", "Lim", "angela.lim@gbox.adnu.edu.ph", "CBA", "GABAY", "2nd Year"),
        ("2022-00003", "Luis", "Bautista", "luis.bautista@gbox.adnu.edu.ph", "CHSS", None, "1st Year"),
        ("2022-00004", "Hana", "Villanueva", "hana.villanueva@gbox.adnu.edu.ph", "CON", "LEAP", "4th Year"),
        ("2022-00005", "Marco", "Fernandez", "marco.fernandez@gbox.adnu.edu.ph", "CCS", "JPCS", "2nd Year"),
        ("2022-00006", "Sofia", "Garcia", "sofia.garcia@gbox.adnu.edu.ph", "CED", None, "3rd Year"),
        ("2022-00007", "Renz", "Aquino", "renz.aquino@gbox.adnu.edu.ph", "CCS", "PIXEL", "1st Year"),
        ("2022-00008", "Trisha", "Mendoza", "trisha.mendoza@gbox.adnu.edu.ph", "CSEA", None, "5th Year"),
        ("2022-00009", "Jan", "Ocampo", "jan.ocampo@gbox.adnu.edu.ph", "COL", None, "Graduate"),
    ]
    for number, first, last, email, college, org, year in samples:
        students.append(
            _add_user(
                db,
                student_number=number,
                first_name=first,
                last_name=last,
                email=email,
                password="password123",
                college=college,
                organization=org,
                year_level=year,
            )
        )
    return [admin, *students]


def _seed_elections(db: Session, admin: User, voters: list[User]) -> None:
    if db.scalar(select(VotingEvent).where(VotingEvent.title == "Ateneo Student Government Elections")):
        return

    now = utcnow()
    asg = VotingEvent(
        title="Ateneo Student Government Elections",
        description="Annual university-wide student government election.",
        election_type=ElectionType.UNIVERSITY,
        start_date=now - timedelta(days=1),
        end_date=now + timedelta(days=2),
        result_visibility=ResultVisibility.LIVE,
        status=ElectionStatus.ACTIVE,
        created_by=admin.id,
    )
    db.add(asg)
    db.flush()
    db.add(ElectionEligibility(event_id=asg.id, eligibility_type=EligibilityType.ALL_STUDENTS))
    _add_position(
        db,
        asg,
        "President",
        1,
        [
            ("Carlo Dela Cruz", "CCS", "CSS", "Digital transformation of student services and transparent governance."),
            ("Angela Ramos", "CBA", "GABAY", "Inclusive campus initiatives and stronger academic support systems."),
        ],
    )
    _add_position(
        db,
        asg,
        "Vice President",
        2,
        [
            ("Luis Bautista", "CHSS", None, "Student welfare, mental health advocacy, and campus accessibility."),
            ("Hana Villanueva", "CON", "LEAP", "Community outreach and university-barangay partnership programs."),
            ("Marco Fernandez", "CCS", "JPCS", "Technology-driven campus solutions and digital skills access."),
        ],
    )
    _add_position(
        db,
        asg,
        "Secretary",
        3,
        [
            ("Sofia Garcia", "CED", None, "Streamlined communication and accessible records management."),
            ("Renz Aquino", "CCS", "PIXEL", "Digital documentation systems and creative communication."),
        ],
    )
    _add_position(
        db,
        asg,
        "CCS Representative",
        4,
        [
            ("Trisha Mendoza", "CCS", "JPCS", "Advocating for tech resources and CCS student welfare."),
            ("Jan Ocampo", "CCS", "CSS", "Expanded internship programs and industry partnerships."),
        ],
        college="CCS",
    )

    ccs = VotingEvent(
        title="CCS Student Council Elections",
        description="College of Computer Studies student council election.",
        election_type=ElectionType.COLLEGE,
        start_date=now - timedelta(hours=8),
        end_date=now + timedelta(days=1),
        result_visibility=ResultVisibility.SCHEDULED,
        result_release_date=now + timedelta(days=1),
        status=ElectionStatus.ACTIVE,
        created_by=admin.id,
    )
    db.add(ccs)
    db.flush()
    db.add(ElectionEligibility(event_id=ccs.id, eligibility_type=EligibilityType.COLLEGE_ONLY, college_id=_college(db, "CCS").id))
    _add_position(
        db,
        ccs,
        "CCS President",
        1,
        [
            ("Ana Reyes", "CCS", "JPCS", "Industry-ready computing education."),
            ("Ben Santos", "CCS", "CSS", "Stronger mentorship and student support."),
        ],
        college="CCS",
    )

    jpcs = VotingEvent(
        title="JPCS Officers Election",
        description="JPCS chapter officer election.",
        election_type=ElectionType.ORGANIZATION,
        start_date=now + timedelta(days=7),
        end_date=now + timedelta(days=8),
        result_visibility=ResultVisibility.HIDDEN,
        status=ElectionStatus.UPCOMING,
        created_by=admin.id,
    )
    db.add(jpcs)
    db.flush()
    db.add(ElectionEligibility(event_id=jpcs.id, eligibility_type=EligibilityType.ORGANIZATION_ONLY, organization_id=_org(db, "JPCS").id))

    cba = VotingEvent(
        title="CBA Student Council Elections",
        description="Closed College of Business and Accountancy council election.",
        election_type=ElectionType.COLLEGE,
        start_date=now - timedelta(days=15),
        end_date=now - timedelta(days=13),
        result_visibility=ResultVisibility.HIDDEN,
        status=ElectionStatus.CLOSED,
        created_by=admin.id,
    )
    db.add(cba)
    db.flush()
    db.add(ElectionEligibility(event_id=cba.id, eligibility_type=EligibilityType.COLLEGE_ONLY, college_id=_college(db, "CBA").id))
    _add_position(
        db,
        cba,
        "CBA President",
        1,
        [
            ("Marco Flores", "CBA", None, "Transparent budgeting and academic partnerships."),
            ("Luz Garcia", "CBA", "GABAY", "Student-first business leadership."),
        ],
        college="CBA",
    )
    db.flush()

    for index, voter in enumerate(voters[2:], start=1):
        _add_vote(db, voter, asg, offset_hours=index)
        if voter.college and voter.college.abbreviation == "CBA":
            _add_vote(db, voter, cba, offset_hours=index)


def seed_database(db: Session) -> None:
    _seed_reference_data(db)
    users = _seed_users(db)
    admin = users[0]
    voters = users[1:]
    _seed_elections(db, admin, voters)
    db.commit()
