"""
MongoDB 读取：跟 server/src/db.ts 对应，只读。
"""
from typing import Iterator, Optional
from pymongo import MongoClient
from pymongo.database import Database

from config import MONGO_URI, MONGO_DB, CHARACTER

_client: Optional[MongoClient] = None


def db() -> Database:
    global _client
    if _client is None:
        if not MONGO_URI:
            raise RuntimeError("MONGO_URI is empty — fill tts/.env")
        _client = MongoClient(MONGO_URI)
    return _client[MONGO_DB]


def _slug_filter(character: str) -> dict:
    """根据简/繁过滤。slug 后缀 _s = 简体, _t = 繁体"""
    if character == "simplified":
        return {"id": {"$regex": r"_s$"}}
    if character == "traditional":
        return {"id": {"$regex": r"_t$"}}
    return {}  # both


def iter_articles(
    volume: Optional[int] = None,
    character: str = CHARACTER,
    limit: Optional[int] = None,
) -> Iterator[dict]:
    """
    流式迭代文章。返回 dict：
    {
        "_id": ObjectId,
        "volume": "85",          (字符串，现有数据格式)
        "id": "0_prayer_s",
        "title": "...",
        "author": "...",
        "category": "...",
        "content": ["...", "", "<img.jpg>", ...],
        "mins": 10,
    }

    按 volume 升序 + id 升序返回，方便进度观感。
    """
    q = _slug_filter(character)
    if volume is not None:
        q["volume"] = str(volume)

    cursor = db().Articles.find(q).sort([("volume", 1), ("id", 1)])
    if limit:
        cursor = cursor.limit(limit)
    for doc in cursor:
        yield doc


def get_one(volume: int, slug: str) -> Optional[dict]:
    return db().Articles.find_one({"volume": str(volume), "id": slug})


def count_articles(character: str = CHARACTER) -> int:
    return db().Articles.count_documents(_slug_filter(character))


def list_volumes() -> list[int]:
    """所有期号（升序）"""
    vols = db().Articles.distinct("volume")
    return sorted(int(v) for v in vols if str(v).isdigit())


if __name__ == "__main__":
    # 测试连通
    n = count_articles("simplified")
    vols = list_volumes()
    print(f"✓ Connected to {MONGO_DB}")
    print(f"✓ Simplified articles: {n}")
    print(f"✓ Volumes: {len(vols)} (from {min(vols)} to {max(vols)})")
