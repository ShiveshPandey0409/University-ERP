"""Role-filtered navigation menu — reimplements the MenuHelper join
(MENU_ITEMS x MENU_ROLE_MAPPING x UROLLS). Items without a role mapping are hidden
(legacy behavior); ancestors of visible items are included so the tree stays connected.
"""
from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.deps import Principal, get_current_user
from app.db.session import get_db
from app.models.system import MenuItem, MenuRoleMapping
from app.schemas.auth import MenuNode

router = APIRouter(prefix="/menu", tags=["menu"])


def _build_tree(items: list[MenuItem]) -> list[MenuNode]:
    by_parent: dict[int | None, list[MenuItem]] = {}
    for it in items:
        by_parent.setdefault(it.parent_id, []).append(it)
    for kids in by_parent.values():
        kids.sort(key=lambda m: (m.display_order or 0, m.id))

    def make(node: MenuItem) -> MenuNode:
        return MenuNode(
            id=node.id,
            text=node.menu_text,
            url=node.menu_url,
            icon=node.menu_icon,
            section=node.menu_section,
            children=[make(c) for c in by_parent.get(node.id, [])],
        )

    ids = {it.id for it in items}
    roots = [it for it in items if it.parent_id is None or it.parent_id not in ids]
    roots.sort(key=lambda m: (m.display_order or 0, m.id))
    return [make(r) for r in roots]


@router.get("", response_model=list[MenuNode])
def get_menu(
    user: Principal = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[MenuNode]:
    roles = set(user.roles)
    # Filter IS_ACTIVE in Python: rendering a bit-column boolean predicate fails on this
    # instance's ANSI/QUOTED_IDENTIFIER settings, and MENU_ITEMS is tiny (~37 rows).
    all_items = [it for it in db.execute(select(MenuItem)).scalars().all() if it.is_active]
    by_id = {it.id: it for it in all_items}

    mappings = db.execute(select(MenuRoleMapping.menu_id, MenuRoleMapping.role_id)).all()
    allowed = {mid for mid, rid in mappings if rid in roles}

    # include ancestors of every allowed item so parents render
    keep: set[int] = set()
    for mid in allowed:
        cur = by_id.get(mid)
        while cur is not None and cur.id not in keep:
            keep.add(cur.id)
            cur = by_id.get(cur.parent_id) if cur.parent_id else None

    return _build_tree([by_id[i] for i in keep])
