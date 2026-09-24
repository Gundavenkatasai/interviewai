#!/usr/bin/env python3
"""Interview AI Bridge for linkedin-skills.

Provides a clean JSON CLI interface between the Interview AI Node.js backend
and the upstream Python libraries (lib.url_parser, lib.backend_selector,
lib.apify_client, lib.publora_client, lib.pixfaro_client).
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

# Ensure UTF-8 stdout/stderr on all platforms (especially Windows)
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Add services/linkedin-skills to sys.path so lib imports correctly
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from lib._env import load_env
load_env()


def get_active_backend() -> dict:
    from lib.backend_selector import active_backend
    backend = active_backend()
    publora_key = bool(os.getenv("PUBLORA_API_KEY"))
    platform_id = bool(os.getenv("LINKEDIN_PLATFORM_ID"))
    apify_token = bool(os.getenv("APIFY_TOKEN"))
    pixfaro_token = bool(os.getenv("PIXFARO_TOKEN"))

    return {
        "success": True,
        "backend": backend,
        "providers": {
            "publora": {
                "configured": publora_key and platform_id,
                "hasApiKey": publora_key,
                "hasPlatformId": platform_id,
            },
            "apify": {
                "configured": apify_token,
            },
            "pixfaro": {
                "configured": pixfaro_token,
            },
        },
    }


def parse_url_cmd(url: str) -> dict:
    from lib.url_parser import parse_linkedin_url
    try:
        parsed = parse_linkedin_url(url)
        return {
            "success": True,
            "data": parsed,
        }
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def fetch_post_cmd(url: str) -> dict:
    from lib.backend_selector import fetch_post
    try:
        post_data = fetch_post(url)
        if not post_data:
            return {
                "success": False,
                "error": "Unable to fetch post via Apify (post may be private, login-walled, or URL invalid). Please paste the text manually.",
            }
        return {
            "success": True,
            "isUntrustedExternalContent": True,
            "data": post_data,
        }
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def fetch_comments_cmd(post_id: str, max_items: int = 20, sort_order: str = "most relevant") -> dict:
    from lib.apify_client import ApifyClient
    try:
        client = ApifyClient()
        comments = client.fetch_post_comments(post_id=post_id, max_items=max_items, sort_order=sort_order)
        return {
            "success": True,
            "isUntrustedExternalContent": True,
            "data": comments,
        }
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def fetch_engagers_cmd(url: str, max_items: int = 50) -> dict:
    from lib.apify_client import ApifyClient
    try:
        client = ApifyClient()
        engagers = client.fetch_post_engagers(post_url=url, max_items=max_items)
        return {
            "success": True,
            "isUntrustedExternalContent": True,
            "data": engagers,
        }
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def fetch_user_comments_cmd(username: str, limit: int = 30) -> dict:
    from lib.apify_client import ApifyClient
    try:
        client = ApifyClient()
        comments = client.fetch_user_recent_comments(username=username, result_limit=limit)
        return {
            "success": True,
            "isUntrustedExternalContent": True,
            "data": comments,
        }
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def publish_cmd(kind: str, target_url: str, draft_text: str, platform_id: str | None = None, scheduled_time: str | None = None, media_urls: list[str] | None = None) -> dict:
    from lib.backend_selector import publish
    platforms = [{"platform": "linkedin", "platformId": platform_id}] if platform_id else None
    try:
        resp = publish(
            kind=kind,
            draft_text=draft_text,
            target_url=target_url,
            platforms=platforms,
            scheduled_time=scheduled_time,
            media_urls=media_urls,
        )
        return {"success": True, "data": resp}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def unpublish_cmd(post_group_id: str) -> dict:
    from lib.backend_selector import unpublish
    try:
        resp = unpublish(post_group_id=post_group_id)
        return {"success": True, "data": resp}
    except Exception as exc:
        return {"success": False, "error": str(exc)}


def quote_card_cmd(text: str, handle: str = "@InterviewAI", style: str = "brand") -> dict:
    from lib import quote_card
    try:
        resp = quote_card(text, handle=handle, style=style)
        return {"success": True, "data": resp}
    except Exception as exc:
        # Graceful fallback: return text representation
        return {
            "success": True,
            "fallback": True,
            "data": {
                "text": text,
                "handle": handle,
                "style": style,
                "note": f"Pixfaro client fallback: {exc}",
            },
        }


def illustrate_cmd(prompt: str, kind: str = "wide") -> dict:
    from lib import illustrate
    try:
        resp = illustrate(prompt, kind=kind)
        return {"success": True, "data": resp}
    except Exception as exc:
        # Graceful fallback: return prompt suggestion
        return {
            "success": True,
            "fallback": True,
            "data": {
                "prompt": prompt,
                "kind": kind,
                "note": f"Pixfaro client fallback: {exc}",
            },
        }


def main():
    parser = argparse.ArgumentParser(description="Interview AI Bridge for linkedin-skills")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # active-backend
    subparsers.add_parser("active-backend")

    # parse-url
    p_url = subparsers.add_parser("parse-url")
    p_url.add_argument("url", help="LinkedIn URL to parse")

    # fetch-post
    f_post = subparsers.add_parser("fetch-post")
    f_post.add_argument("url", help="LinkedIn post URL to fetch")

    # fetch-comments
    f_comm = subparsers.add_parser("fetch-comments")
    f_comm.add_argument("post_id", help="LinkedIn post ID or URL")
    f_comm.add_argument("--max-items", type=int, default=20, help="Max comments to fetch")
    f_comm.add_argument("--sort-order", default="most relevant", choices=["most relevant", "most recent"])

    # fetch-engagers
    f_eng = subparsers.add_parser("fetch-engagers")
    f_eng.add_argument("url", help="LinkedIn post URL to fetch engagers for")
    f_eng.add_argument("--max-items", type=int, default=50, help="Max engagers to fetch")

    # fetch-user-comments
    f_ucomm = subparsers.add_parser("fetch-user-comments")
    f_ucomm.add_argument("username", help="LinkedIn username/handle")
    f_ucomm.add_argument("--limit", type=int, default=30, help="Max user comments")

    # publish
    pub = subparsers.add_parser("publish")
    pub.add_argument("--kind", required=True, choices=["post", "comment", "reply", "reshare"])
    pub.add_argument("--target-url", required=True)
    pub.add_argument("--text", required=True)
    pub.add_argument("--platform-id")
    pub.add_argument("--scheduled-time")
    pub.add_argument("--media-urls", nargs="*")

    # unpublish
    unpub = subparsers.add_parser("unpublish")
    unpub.add_argument("post_group_id")

    # quote-card
    qc = subparsers.add_parser("quote-card")
    qc.add_argument("text")
    qc.add_argument("--handle", default="@InterviewAI")
    qc.add_argument("--style", default="brand")

    # illustrate
    ill = subparsers.add_parser("illustrate")
    ill.add_argument("prompt")
    ill.add_argument("--kind", default="wide")

    args = parser.parse_args()

    result = {}
    if args.command == "active-backend":
        result = get_active_backend()
    elif args.command == "parse-url":
        result = parse_url_cmd(args.url)
    elif args.command == "fetch-post":
        result = fetch_post_cmd(args.url)
    elif args.command == "fetch-comments":
        result = fetch_comments_cmd(args.post_id, max_items=args.max_items, sort_order=args.sort_order)
    elif args.command == "fetch-engagers":
        result = fetch_engagers_cmd(args.url, max_items=args.max_items)
    elif args.command == "fetch-user-comments":
        result = fetch_user_comments_cmd(args.username, limit=args.limit)
    elif args.command == "publish":
        result = publish_cmd(
            kind=args.kind,
            target_url=args.target_url,
            draft_text=args.text,
            platform_id=args.platform_id,
            scheduled_time=args.scheduled_time,
            media_urls=args.media_urls,
        )
    elif args.command == "unpublish":
        result = unpublish_cmd(args.post_group_id)
    elif args.command == "quote-card":
        result = quote_card_cmd(args.text, handle=args.handle, style=args.style)
    elif args.command == "illustrate":
        result = illustrate_cmd(args.prompt, kind=args.kind)

    print(json.dumps(result, ensure_ascii=False))


if __name__ == "__main__":
    main()
