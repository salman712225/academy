import logging
from contextlib import asynccontextmanager
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import OperationFailure
from app.core.config import settings

logger = logging.getLogger("academy_db")

# Global clients and state
client: AsyncIOMotorClient = None
db = None
is_replica_set: bool = False

async def connect_to_mongo():
    global client, db, is_replica_set
    logger.info(f"Connecting to MongoDB at {settings.MONGODB_URL}...")
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    try:
        # Check replica set status
        status = await client.admin.command("replSetGetStatus")
        logger.info(f"MongoDB Replica Set '{status.get('set')}' is online.")
        is_replica_set = True
    except OperationFailure:
        try:
            logger.info("Attempting to auto-initiate MongoDB single-node replica set...")
            await client.admin.command("replSetInitiate")
            logger.info("MongoDB replica set initiated successfully!")
            is_replica_set = True
        except Exception as init_err:
            logger.warning(
                f"MongoDB is not running as a replica set and auto-initiation failed ({str(init_err)}). "
                "ACID Transactions will fall back to single operations. "
                "To enable actual transactions, run MongoDB with replica sets enabled (--replSet rs0) and run rs.initiate()."
            )
            is_replica_set = False

async def close_mongo_connection():
    global client
    if client:
        client.close()
        logger.info("MongoDB connection closed.")

async def get_db():
    return db

@asynccontextmanager
async def transaction_scope():
    """
    Context manager for executing MongoDB operations within a transaction.
    Falls back to simple execution (yielding None) if the database is standalone.
    """
    global client, is_replica_set
    if not client:
        raise RuntimeError("Database client not initialized")
        
    if is_replica_set:
        async with await client.start_session() as session:
            async with session.start_transaction():
                yield session
    else:
        # Fallback to no transaction scope (yields exactly once)
        yield None
