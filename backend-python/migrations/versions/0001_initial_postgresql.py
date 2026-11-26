"""Initial PostgreSQL schema for the six application collections.

Revision ID: 0001_initial
"""
from alembic import op
from models.database import Base

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None

def upgrade():
    # Metadata is the single source for model constraints and relationships.
    Base.metadata.create_all(bind=op.get_bind())

def downgrade():
    # Only tables introduced by this revision are removed.
    Base.metadata.drop_all(bind=op.get_bind(), checkfirst=True)
