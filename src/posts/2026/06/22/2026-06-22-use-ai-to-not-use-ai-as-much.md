---
layout: post
title: "Use AI to not use AI (as much)"
date: "2026-06-22T18:00:00"
categories: ["development"]
tags: ["python","generative ai"]
banner_image: /images/banners/robots.jpg
permalink: /2026/06/22/use-ai-to-not-use-ai-as-much
description: Use AI to build tools to let you use less AI
---

This squarely falls into the "everyone probably knows this but it didn't click with me right away" category so please feel free to laugh at my ignorance, but it's something I realized over the past few months, and as I just used this technique this morning, I figured I'd share it on the blog. The idea is simple - it's trivial to ask a Gen AI tool to do something for you - and depending on the ask, may work great. But what I realized a few months back, especially in regards to having AI parse data, is that you can also use the opportunity to generate a tool (like a Python or Node script) so you don't need to return to the AI tool again. This becomes especially useful if you want to slightly tweak the output over time or gradually add more features.

For my example today, it was a GitHub alert. Last month I got a few emails about Actions storage usage and it repeated this month:

<p>
<img src="https://static.raymondcamden.com/images/2026/06/ai1.jpg" loading="lazy" alt="Email from GitHub warning about Actions Usage" class="imgborder imgcenter">
</p>

I know *of* GitHub Actions, but I don't really use them much myself. That being said, GitHub's billing and usage reports were good for an aggregate high level look at my account, but were surprisingly *unhelpful* in terms of telling me *where* my usage was coming from. Apparently I was supposed to go through my 300+ repositories and find this out by checking the settings for each? That's crazy. It's also completely possible I missed a way to get this value easier, but honestly, I wasn't sure what to do. 

I finally found a usage report generator in my settings, I used that, and quickly got a CSV report. I took a quick look at it, nothing stood out, so I went to my AI tool and simply asked it to parse it for me. 

And it did - swimmingly - giving me a culprit to point to - or in my case - simply delete. It was a repo I had set up to test something that was apparently storing some artifacts I didn't need. Problem solved.

But... I wasn't convinced this wasn't going to happen again, so I used the technique that first occurred to me a few months back, and is pretty obvious, but I simply asked my tool to generate a Python script for me that would create a report. 

For this I used [Cursor](https://cursor.com), a tool I've been using a lot lately, and in Plan mode, simply asked:

"pay attention to the csv. it is a GitHub usage report. I need a general Python script that can be run at the command line that parses this CSV and reports on usage. the idea is to help me figure out what repo is causing the most usage"

It chewed on the CSV a bit, and then asked what it should prioritize in terms of the report. Now, my email warning was about *storage*, but Cursor suggested total cost, so I went along. After it built the script, I liked the output, but the 'problem' repo (that I had already corrected) wasn't necessarily given enough attention. 

I then went back to Cursor with:

"this works, but i noticed that testing-boxlang-desktop, which used a lot of storage, doesn't get call out quite as much. can we maybe add another report after the gross amount one that shows top repos by stoage?"

Thank god AI doesn't complain about typos so much as I didn't even notice that till just now. This iteration added a second report and really made it a great v1 for the script. Speaking of...

## Just show me the code already...

Ok, so if you are also looking at a GitHub usage report and not sure what repo to blame, generate your summary, save the file, and use this script:

```python
#!/usr/bin/env python3
"""Parse GitHub summarized usage CSV exports and report repo-level usage."""

from __future__ import annotations

import argparse
import csv
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path

REQUIRED_COLUMNS = {
    "date",
    "product",
    "sku",
    "quantity",
    "unit_type",
    "gross_amount",
    "net_amount",
    "discount_amount",
    "repository",
}


def parse_float(value: str) -> float:
    if not value or not value.strip():
        return 0.0
    return float(value)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Parse a GitHub summarized usage CSV and rank repositories by cost."
    )
    parser.add_argument("csv_file", type=Path, help="Path to summarized usage CSV")
    parser.add_argument(
        "--top",
        type=int,
        default=10,
        metavar="N",
        help="Number of repositories to show in ranking (default: 10)",
    )
    parser.add_argument(
        "--product",
        help="Filter rows by product (e.g. actions, git_lfs)",
    )
    parser.add_argument("--sku", help="Filter rows by SKU")
    parser.add_argument(
        "--from",
        dest="date_from",
        metavar="YYYY-MM-DD",
        help="Include rows on or after this date",
    )
    parser.add_argument(
        "--to",
        dest="date_to",
        metavar="YYYY-MM-DD",
        help="Include rows on or before this date",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Emit structured JSON instead of formatted text",
    )
    return parser.parse_args()


def load_rows(path: Path) -> list[dict[str, str]]:
    if not path.is_file():
        print(f"Error: file not found: {path}", file=sys.stderr)
        sys.exit(1)

    with path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        if reader.fieldnames is None:
            print(f"Error: {path} is empty or has no header row", file=sys.stderr)
            sys.exit(1)

        missing = REQUIRED_COLUMNS - set(reader.fieldnames)
        if missing:
            missing_list = ", ".join(sorted(missing))
            print(
                f"Error: {path} is missing required columns: {missing_list}",
                file=sys.stderr,
            )
            sys.exit(1)

        return list(reader)


def filter_rows(
    rows: list[dict[str, str]],
    *,
    product: str | None,
    sku: str | None,
    date_from: str | None,
    date_to: str | None,
) -> list[dict[str, str]]:
    filtered: list[dict[str, str]] = []
    for row in rows:
        if product and row["product"] != product:
            continue
        if sku and row["sku"] != sku:
            continue
        if date_from and row["date"] < date_from:
            continue
        if date_to and row["date"] > date_to:
            continue
        filtered.append(row)
    return filtered


@dataclass
class SkuBreakdown:
    sku: str
    unit_type: str
    quantity: float = 0.0
    gross_amount: float = 0.0


@dataclass
class RepoUsage:
    repository: str
    gross_amount: float = 0.0
    net_amount: float = 0.0
    discount_amount: float = 0.0
    row_count: int = 0
    skus: dict[tuple[str, str], SkuBreakdown] = field(default_factory=dict)

    def add_row(self, row: dict[str, str]) -> None:
        gross = parse_float(row["gross_amount"])
        net = parse_float(row["net_amount"])
        discount = parse_float(row["discount_amount"])
        quantity = parse_float(row["quantity"])
        sku = row["sku"]
        unit_type = row["unit_type"]

        self.gross_amount += gross
        self.net_amount += net
        self.discount_amount += discount
        self.row_count += 1

        key = (sku, unit_type)
        if key not in self.skus:
            self.skus[key] = SkuBreakdown(sku=sku, unit_type=unit_type)
        breakdown = self.skus[key]
        breakdown.quantity += quantity
        breakdown.gross_amount += gross


def aggregate_by_repo(rows: list[dict[str, str]]) -> list[RepoUsage]:
    repos: dict[str, RepoUsage] = {}
    for row in rows:
        repository = row["repository"].strip() or "(unknown)"
        if repository not in repos:
            repos[repository] = RepoUsage(repository=repository)
        repos[repository].add_row(row)

    return sorted(repos.values(), key=lambda repo: repo.gross_amount, reverse=True)


def is_storage_row(row: dict[str, str]) -> bool:
    return "storage" in row["sku"].lower()


@dataclass
class RepoStorage:
    repository: str
    quantity: float = 0.0
    gross_amount: float = 0.0
    row_count: int = 0
    skus: dict[str, SkuBreakdown] = field(default_factory=dict)

    def add_row(self, row: dict[str, str]) -> None:
        gross = parse_float(row["gross_amount"])
        quantity = parse_float(row["quantity"])
        sku = row["sku"]
        unit_type = row["unit_type"]

        self.gross_amount += gross
        self.quantity += quantity
        self.row_count += 1

        if sku not in self.skus:
            self.skus[sku] = SkuBreakdown(sku=sku, unit_type=unit_type)
        breakdown = self.skus[sku]
        breakdown.quantity += quantity
        breakdown.gross_amount += gross


def aggregate_storage_by_repo(rows: list[dict[str, str]]) -> list[RepoStorage]:
    repos: dict[str, RepoStorage] = {}
    for row in rows:
        if not is_storage_row(row):
            continue
        repository = row["repository"].strip() or "(unknown)"
        if repository not in repos:
            repos[repository] = RepoStorage(repository=repository)
        repos[repository].add_row(row)

    return sorted(repos.values(), key=lambda repo: repo.quantity, reverse=True)


def storage_repo_payload(repo: RepoStorage, total_storage: float) -> dict:
    return {
        "repository": repo.repository,
        "quantity_gigabyte_hours": repo.quantity,
        "gross_amount": repo.gross_amount,
        "percent_of_total_storage": (
            (repo.quantity / total_storage * 100) if total_storage else 0.0
        ),
        "row_count": repo.row_count,
        "skus": [
            {
                "sku": item.sku,
                "unit_type": item.unit_type,
                "quantity": item.quantity,
                "gross_amount": item.gross_amount,
            }
            for item in sorted(repo.skus.values(), key=lambda sku_item: sku_item.quantity, reverse=True)
        ],
    }


def format_money(amount: float) -> str:
    return f"${amount:.4f}"


def format_percent(part: float, whole: float) -> str:
    if whole == 0:
        return "0.0%"
    return f"{(part / whole) * 100:.1f}%"


def print_storage_table(storage_repos: list[RepoStorage], top: int) -> None:
    print("Top repositories by storage")
    print("-" * 28)

    if not storage_repos:
        print("No storage usage found.")
        print()
        return

    total_storage = sum(repo.quantity for repo in storage_repos)
    print(
        f"{'#':>3}  {'Repository':<26} {'GB-hours':>10} {'%':>7} {'Gross':>10} {'Rows':>5}"
    )
    for index, repo in enumerate(storage_repos[:top], start=1):
        print(
            f"{index:>3}  {repo.repository:<26} "
            f"{repo.quantity:>10.2f} "
            f"{format_percent(repo.quantity, total_storage):>7} "
            f"{format_money(repo.gross_amount):>10} "
            f"{repo.row_count:>5}"
        )
    print()


def print_text_report(
    path: Path,
    rows: list[dict[str, str]],
    repos: list[RepoUsage],
    storage_repos: list[RepoStorage],
    top: int,
) -> None:
    total_gross = sum(repo.gross_amount for repo in repos)
    total_net = sum(repo.net_amount for repo in repos)
    dates = [row["date"] for row in rows]
    date_range = f"{min(dates)} to {max(dates)}" if dates else "n/a"

    print("GitHub Usage Report")
    print("=" * 19)
    print(f"File: {path.name}")
    print(f"Period: {date_range} ({len(rows)} rows)")
    print(f"Total gross: {format_money(total_gross)}   Total net: {format_money(total_net)}")
    print()

    if not repos:
        print("No matching usage rows found.")
        return

    print("Top repositories by gross amount")
    print("-" * 32)
    print(f"{'#':>3}  {'Repository':<26} {'Gross':>10} {'%':>7} {'Net':>10} {'Rows':>5}")
    for index, repo in enumerate(repos[:top], start=1):
        print(
            f"{index:>3}  {repo.repository:<26} "
            f"{format_money(repo.gross_amount):>10} "
            f"{format_percent(repo.gross_amount, total_gross):>7} "
            f"{format_money(repo.net_amount):>10} "
            f"{repo.row_count:>5}"
        )

    print()
    print_storage_table(storage_repos, top)
    print("Details for top repos")
    print("-" * 19)
    for repo in repos[:top]:
        print(f"{repo.repository} ({format_money(repo.gross_amount)} gross)")
        sku_items = sorted(repo.skus.values(), key=lambda item: item.gross_amount, reverse=True)
        for item in sku_items:
            print(
                f"  {item.sku:<22} {item.quantity:>10.2f} {item.unit_type:<16} "
                f"{format_money(item.gross_amount):>10}"
            )
        print()


def print_json_report(
    path: Path,
    rows: list[dict[str, str]],
    repos: list[RepoUsage],
    storage_repos: list[RepoStorage],
    top: int,
) -> None:
    total_gross = sum(repo.gross_amount for repo in repos)
    total_net = sum(repo.net_amount for repo in repos)
    total_storage = sum(repo.quantity for repo in storage_repos)
    dates = [row["date"] for row in rows]

    payload = {
        "file": str(path),
        "row_count": len(rows),
        "date_from": min(dates) if dates else None,
        "date_to": max(dates) if dates else None,
        "total_gross_amount": total_gross,
        "total_net_amount": total_net,
        "total_storage_gigabyte_hours": total_storage,
        "repositories": [
            {
                "rank": index,
                "repository": repo.repository,
                "gross_amount": repo.gross_amount,
                "net_amount": repo.net_amount,
                "discount_amount": repo.discount_amount,
                "row_count": repo.row_count,
                "percent_of_total_gross": (
                    (repo.gross_amount / total_gross * 100) if total_gross else 0.0
                ),
                "skus": [
                    {
                        "sku": item.sku,
                        "unit_type": item.unit_type,
                        "quantity": item.quantity,
                        "gross_amount": item.gross_amount,
                    }
                    for item in sorted(
                        repo.skus.values(),
                        key=lambda sku_item: sku_item.gross_amount,
                        reverse=True,
                    )
                ],
            }
            for index, repo in enumerate(repos[:top], start=1)
        ],
        "storage_repositories": [
            {"rank": index, **storage_repo_payload(repo, total_storage)}
            for index, repo in enumerate(storage_repos[:top], start=1)
        ],
    }
    print(json.dumps(payload, indent=2))


def main() -> None:
    args = parse_args()
    rows = load_rows(args.csv_file)
    filtered = filter_rows(
        rows,
        product=args.product,
        sku=args.sku,
        date_from=args.date_from,
        date_to=args.date_to,
    )
    repos = aggregate_by_repo(filtered)
    storage_repos = aggregate_storage_by_repo(filtered)

    if args.json:
        print_json_report(args.csv_file, filtered, repos, storage_repos, args.top)
    else:
        print_text_report(args.csv_file, filtered, repos, storage_repos, args.top)


if __name__ == "__main__":
    main()
```

You can also find this here: <https://github.com/cfjedimaster/pythondemos/tree/main/ghusageparser>. Note that this uses no external dependencies outside of standard library modules. Usage is simple:

```
python -h
```

Which gives:

<p>
<img src="https://static.raymondcamden.com/images/2026/06/ai2.png" loading="lazy" alt="Help text from CLI tool" class="imgborder imgcenter">
</p>

Honestly, none of those arguments were ideas I had but they all make sense. And here's how the report looks:

<p>
<img src="https://static.raymondcamden.com/images/2026/06/ai3.png" loading="lazy" alt="Help text from CLI tool" class="imgborder imgcenter">
</p>

The 'culprit' was `testing-boxlang-desktop` which as I said, was just for testing, so easy to delete. Honestly, `tweetback` surprised me. This is a repo I created as an export from Twitter and apparently it's got a lot of media. I didn't delete it - but may do so in the future. 

Anyway, let me know what you think and if this could be helpful to you!

Photo by <a href="https://unsplash.com/@simonkadula?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Simon Kadula</a> on <a href="https://unsplash.com/photos/a-factory-filled-with-lots-of-orange-machines-8gr6bObQLOI?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText">Unsplash</a>
