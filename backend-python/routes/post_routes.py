from fastapi import APIRouter
from controllers import post_controller as c

router = APIRouter()
router.add_api_route("/api/posts", c.get_posts, methods=["GET"])
router.add_api_route("/api/posts", c.create_post, methods=["POST"], status_code=201)
router.add_api_route("/api/posts/{pid}/likes", c.get_likes, methods=["GET"])
router.add_api_route("/api/posts/{pid}", c.update_post, methods=["PUT"])
router.add_api_route("/api/posts/{pid}", c.delete_post, methods=["DELETE"])
router.add_api_route("/api/posts/{pid}/like", c.toggle_like, methods=["POST"])
router.add_api_route("/api/posts/{pid}/comments", c.get_comments, methods=["GET"])
router.add_api_route("/api/posts/{pid}/comments", c.create_comment, methods=["POST"], status_code=201)
router.add_api_route("/api/posts/{pid}/comments/{cid}", c.delete_comment, methods=["DELETE"])
