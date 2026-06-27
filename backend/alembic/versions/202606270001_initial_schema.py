"""initial VoteHub schema

Revision ID: 202606270001
Revises:
Create Date: 2026-06-27 00:00:01
"""
from alembic import op
import sqlalchemy as sa


revision = "202606270001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "colleges",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=180), nullable=False),
        sa.Column("abbreviation", sa.String(length=16), nullable=False),
        sa.Column("status", sa.Enum("ACTIVE", "INACTIVE", "ARCHIVED", name="recordstatus", native_enum=False), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("abbreviation"),
        sa.UniqueConstraint("name"),
    )
    op.create_index(op.f("ix_colleges_abbreviation"), "colleges", ["abbreviation"], unique=False)
    op.create_index(op.f("ix_colleges_id"), "colleges", ["id"], unique=False)

    op.create_table(
        "organizations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=180), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("status", sa.Enum("ACTIVE", "INACTIVE", "ARCHIVED", name="recordstatus", native_enum=False), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index(op.f("ix_organizations_id"), "organizations", ["id"], unique=False)
    op.create_index(op.f("ix_organizations_name"), "organizations", ["name"], unique=False)

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("student_number", sa.String(length=64), nullable=False),
        sa.Column("first_name", sa.String(length=100), nullable=False),
        sa.Column("middle_name", sa.String(length=100), nullable=True),
        sa.Column("last_name", sa.String(length=100), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("college_id", sa.Integer(), nullable=True),
        sa.Column("organization_id", sa.Integer(), nullable=True),
        sa.Column("year_level", sa.String(length=32), nullable=True),
        sa.Column("program", sa.String(length=180), nullable=True),
        sa.Column("role", sa.Enum("STUDENT", "ADMIN", "ELECTION_MANAGER", name="userrole", native_enum=False), nullable=False),
        sa.Column("status", sa.Enum("ACTIVE", "PENDING", "REJECTED", "SUSPENDED", name="userstatus", native_enum=False), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["college_id"], ["colleges.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("student_number"),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=False)
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_student_number"), "users", ["student_number"], unique=False)

    op.create_table(
        "voting_events",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=220), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("banner", sa.String(length=500), nullable=True),
        sa.Column("election_type", sa.Enum("UNIVERSITY", "COLLEGE", "ORGANIZATION", "SPECIAL", name="electiontype", native_enum=False), nullable=False),
        sa.Column("visibility_scope", sa.String(length=120), nullable=True),
        sa.Column("start_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("end_date", sa.DateTime(timezone=True), nullable=False),
        sa.Column("result_visibility", sa.Enum("LIVE", "HIDDEN", "SCHEDULED", "PARTIAL", "MANUAL", name="resultvisibility", native_enum=False), nullable=False),
        sa.Column("result_release_date", sa.DateTime(timezone=True), nullable=True),
        sa.Column("partial_result_type", sa.Enum("TURNOUT_ONLY", "PERCENTAGE_ONLY", "RANKING_ONLY", name="partialresulttype", native_enum=False), nullable=True),
        sa.Column("results_published_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.Enum("UPCOMING", "ACTIVE", "CLOSED", "ARCHIVED", name="electionstatus", native_enum=False), nullable=False),
        sa.Column("created_by", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_voting_events_end_date"), "voting_events", ["end_date"], unique=False)
    op.create_index(op.f("ix_voting_events_id"), "voting_events", ["id"], unique=False)
    op.create_index(op.f("ix_voting_events_start_date"), "voting_events", ["start_date"], unique=False)
    op.create_index(op.f("ix_voting_events_title"), "voting_events", ["title"], unique=False)

    op.create_table(
        "election_eligibilities",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("eligibility_type", sa.Enum("ALL_STUDENTS", "COLLEGE_ONLY", "ORGANIZATION_ONLY", "CUSTOM", name="eligibilitytype", native_enum=False), nullable=False),
        sa.Column("college_id", sa.Integer(), nullable=True),
        sa.Column("organization_id", sa.Integer(), nullable=True),
        sa.ForeignKeyConstraint(["college_id"], ["colleges.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["event_id"], ["voting_events.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("event_id", "eligibility_type", "college_id", "organization_id", name="uq_event_eligibility_rule"),
    )
    op.create_index(op.f("ix_election_eligibilities_event_id"), "election_eligibilities", ["event_id"], unique=False)
    op.create_index(op.f("ix_election_eligibilities_id"), "election_eligibilities", ["id"], unique=False)

    op.create_table(
        "positions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("position_scope", sa.Enum("UNIVERSITY", "COLLEGE", "ORGANIZATION", "SPECIAL", name="positionscope", native_enum=False), nullable=False),
        sa.Column("college_id", sa.Integer(), nullable=True),
        sa.Column("organization_id", sa.Integer(), nullable=True),
        sa.Column("max_selection", sa.Integer(), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["college_id"], ["colleges.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["event_id"], ["voting_events.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("event_id", "name", name="uq_position_event_name"),
    )
    op.create_index(op.f("ix_positions_event_id"), "positions", ["event_id"], unique=False)
    op.create_index(op.f("ix_positions_id"), "positions", ["id"], unique=False)

    op.create_table(
        "votes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("event_id", sa.Integer(), nullable=False),
        sa.Column("submitted_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["voting_events.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("user_id", "event_id", name="uq_vote_user_event"),
    )
    op.create_index(op.f("ix_votes_event_id"), "votes", ["event_id"], unique=False)
    op.create_index(op.f("ix_votes_id"), "votes", ["id"], unique=False)
    op.create_index("ix_votes_event_submitted", "votes", ["event_id", "submitted_at"], unique=False)
    op.create_index(op.f("ix_votes_user_id"), "votes", ["user_id"], unique=False)

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=True),
        sa.Column("event_id", sa.Integer(), nullable=True),
        sa.Column("action", sa.Enum("USER_REGISTERED", "USER_VERIFIED", "USER_STATUS_UPDATED", "ELECTION_CREATED", "ELECTION_UPDATED", "CANDIDATE_CREATED", "CANDIDATE_UPDATED", "VOTE_SUBMITTED", "RESULT_PUBLISHED", name="auditaction", native_enum=False), nullable=False),
        sa.Column("entity_type", sa.String(length=80), nullable=True),
        sa.Column("entity_id", sa.String(length=80), nullable=True),
        sa.Column("ip_address", sa.String(length=64), nullable=True),
        sa.Column("user_agent", sa.String(length=500), nullable=True),
        sa.Column("log_metadata", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["event_id"], ["voting_events.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_audit_logs_action"), "audit_logs", ["action"], unique=False)
    op.create_index(op.f("ix_audit_logs_created_at"), "audit_logs", ["created_at"], unique=False)
    op.create_index(op.f("ix_audit_logs_event_id"), "audit_logs", ["event_id"], unique=False)
    op.create_index(op.f("ix_audit_logs_id"), "audit_logs", ["id"], unique=False)
    op.create_index(op.f("ix_audit_logs_user_id"), "audit_logs", ["user_id"], unique=False)

    op.create_table(
        "candidates",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("position_id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=180), nullable=False),
        sa.Column("photo", sa.String(length=500), nullable=True),
        sa.Column("course", sa.String(length=180), nullable=True),
        sa.Column("college_id", sa.Integer(), nullable=True),
        sa.Column("organization_id", sa.Integer(), nullable=True),
        sa.Column("platform", sa.Text(), nullable=True),
        sa.Column("biography", sa.Text(), nullable=True),
        sa.Column("status", sa.Enum("ACTIVE", "WITHDRAWN", "DISQUALIFIED", name="candidatestatus", native_enum=False), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["college_id"], ["colleges.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["position_id"], ["positions.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("position_id", "name", name="uq_candidate_position_name"),
    )
    op.create_index(op.f("ix_candidates_id"), "candidates", ["id"], unique=False)
    op.create_index(op.f("ix_candidates_position_id"), "candidates", ["position_id"], unique=False)

    op.create_table(
        "vote_details",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("vote_id", sa.Integer(), nullable=False),
        sa.Column("candidate_id", sa.Integer(), nullable=True),
        sa.Column("position_id", sa.Integer(), nullable=False),
        sa.Column("is_abstain", sa.Boolean(), nullable=False),
        sa.CheckConstraint("(is_abstain = true AND candidate_id IS NULL) OR (is_abstain = false AND candidate_id IS NOT NULL)", name="ck_vote_detail_candidate_or_abstain"),
        sa.ForeignKeyConstraint(["candidate_id"], ["candidates.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["position_id"], ["positions.id"], ondelete="RESTRICT"),
        sa.ForeignKeyConstraint(["vote_id"], ["votes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("vote_id", "position_id", "candidate_id", name="uq_vote_position_candidate"),
    )
    op.create_index(op.f("ix_vote_details_id"), "vote_details", ["id"], unique=False)
    op.create_index(op.f("ix_vote_details_position_id"), "vote_details", ["position_id"], unique=False)
    op.create_index(op.f("ix_vote_details_vote_id"), "vote_details", ["vote_id"], unique=False)
    op.create_index(
        "uq_vote_position_abstain",
        "vote_details",
        ["vote_id", "position_id"],
        unique=True,
        sqlite_where=sa.text("is_abstain = 1"),
        postgresql_where=sa.text("is_abstain = true"),
    )


def downgrade() -> None:
    op.drop_index("uq_vote_position_abstain", table_name="vote_details")
    op.drop_index(op.f("ix_vote_details_vote_id"), table_name="vote_details")
    op.drop_index(op.f("ix_vote_details_position_id"), table_name="vote_details")
    op.drop_index(op.f("ix_vote_details_id"), table_name="vote_details")
    op.drop_table("vote_details")
    op.drop_index(op.f("ix_candidates_position_id"), table_name="candidates")
    op.drop_index(op.f("ix_candidates_id"), table_name="candidates")
    op.drop_table("candidates")
    op.drop_index(op.f("ix_audit_logs_user_id"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_id"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_event_id"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_created_at"), table_name="audit_logs")
    op.drop_index(op.f("ix_audit_logs_action"), table_name="audit_logs")
    op.drop_table("audit_logs")
    op.drop_index(op.f("ix_votes_user_id"), table_name="votes")
    op.drop_index("ix_votes_event_submitted", table_name="votes")
    op.drop_index(op.f("ix_votes_id"), table_name="votes")
    op.drop_index(op.f("ix_votes_event_id"), table_name="votes")
    op.drop_table("votes")
    op.drop_index(op.f("ix_positions_id"), table_name="positions")
    op.drop_index(op.f("ix_positions_event_id"), table_name="positions")
    op.drop_table("positions")
    op.drop_index(op.f("ix_election_eligibilities_id"), table_name="election_eligibilities")
    op.drop_index(op.f("ix_election_eligibilities_event_id"), table_name="election_eligibilities")
    op.drop_table("election_eligibilities")
    op.drop_index(op.f("ix_voting_events_title"), table_name="voting_events")
    op.drop_index(op.f("ix_voting_events_start_date"), table_name="voting_events")
    op.drop_index(op.f("ix_voting_events_id"), table_name="voting_events")
    op.drop_index(op.f("ix_voting_events_end_date"), table_name="voting_events")
    op.drop_table("voting_events")
    op.drop_index(op.f("ix_users_student_number"), table_name="users")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
    op.drop_index(op.f("ix_organizations_name"), table_name="organizations")
    op.drop_index(op.f("ix_organizations_id"), table_name="organizations")
    op.drop_table("organizations")
    op.drop_index(op.f("ix_colleges_id"), table_name="colleges")
    op.drop_index(op.f("ix_colleges_abbreviation"), table_name="colleges")
    op.drop_table("colleges")
