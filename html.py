#!/usr/bin/env python3
"""
web_report.py

Recursively scans a web/Bun project folder and produces a Markdown report containing:
1. A directory tree (automatically ignoring node_modules, dist, .git, etc.).
2. The contents of selected web source files (.html, .css, .js, .ts, etc.).

Usage:
    python web_report.py ./my-web-app
    python web_report.py ./my-web-app --stdout
    python web_report.py ./my-web-app -o web_docs.md
    python web_report.py ./my-web-app --ext .ts --ext .tsx --ext .css
    python web_report.py ./my-web-app --tree-mode target
"""

import argparse
import os
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Set, Tuple


DEFAULT_SOURCE_EXTENSIONS = (".html", ".css", ".js", ".ts", ".jsx", ".tsx", ".json")

DEFAULT_LANGUAGES = {
    ".html": "html",
    ".htm": "html",
    ".css": "css",
    ".scss": "scss",
    ".sass": "sass",
    ".less": "less",
    ".js": "javascript",
    ".mjs": "javascript",
    ".cjs": "javascript",
    ".ts": "typescript",
    ".mts": "typescript",
    ".cts": "typescript",
    ".jsx": "jsx",
    ".tsx": "tsx",
    ".json": "json",
    ".vue": "vue",
    ".svelte": "svelte",
    ".astro": "astro",
    ".md": "markdown",
}

DEFAULT_EXCLUDED_DIRS = {
    "node_modules",
    "dist",
    "build",
    ".git",
    ".next",
    ".output",
    ".turbo",
    ".cache",
    "coverage",
    ".vscode",
    ".idea",
}


@dataclass
class TreeNode:
    files: Set[str] = field(default_factory=set)
    dirs: Dict[str, "TreeNode"] = field(default_factory=dict)

    def add_file(self, parts: Sequence[str]) -> None:
        if not parts:
            return

        if len(parts) == 1:
            self.files.add(parts[0])
        else:
            self.dirs.setdefault(parts[0], TreeNode()).add_file(parts[1:])

    def add_dir(self, parts: Sequence[str]) -> None:
        if not parts:
            return

        if len(parts) == 1:
            self.dirs.setdefault(parts[0], TreeNode())
        else:
            self.dirs.setdefault(parts[0], TreeNode()).add_dir(parts[1:])

    def entries(self) -> List[Tuple[str, bool]]:
        # Directories first, then files, sorted case-insensitively.
        return (
            [(name, True) for name in sorted(self.dirs, key=str.casefold)]
            + [(name, False) for name in sorted(self.files, key=str.casefold)]
        )


def normalize_extension(value: str) -> str:
    value = value.strip().lower()

    if not value:
        return ""

    if not value.startswith("."):
        value = "." + value

    return value


def parse_extensions(values: Optional[Sequence[str]]) -> Set[str]:
    if not values:
        return set(DEFAULT_SOURCE_EXTENSIONS)

    result = {normalize_extension(value) for value in values}
    result.discard("")

    return result or set(DEFAULT_SOURCE_EXTENSIONS)


def language_for_path(path: Path) -> str:
    return DEFAULT_LANGUAGES.get(normalize_extension(path.suffix), "text")


def scan_all_paths(root: Path, custom_excludes: Set[str]) -> Tuple[List[Path], List[Path]]:
    """
    Return relative file paths and relative directory paths under root,
    ignoring unwanted build and dependency folders.
    """

    if root.is_file():
        return [Path(root.name)], []

    files: Set[Path] = set()
    dirs: Set[Path] = set()

    excluded_dirs = DEFAULT_EXCLUDED_DIRS.union(custom_excludes)

    def on_error(exc: OSError) -> None:
        return None

    for dirpath, dirnames, filenames in os.walk(
        root,
        topdown=True,
        onerror=on_error,
        followlinks=False,
    ):
        # Prune excluded directories in-place so os.walk doesn't descend into them
        dirnames[:] = [d for d in dirnames if d not in excluded_dirs]

        current = Path(dirpath)

        try:
            rel_current = current.relative_to(root)
        except ValueError:
            continue

        if rel_current != Path("."):
            dirs.add(rel_current)

        for name in dirnames:
            dirs.add(rel_current / name)

        for name in filenames:
            files.add(rel_current / name)

    return (
        sorted(files, key=lambda p: p.as_posix()),
        sorted(dirs, key=lambda p: p.as_posix()),
    )


def ancestor_dirs(paths: Iterable[Path]) -> List[Path]:
    result: Set[Path] = set()

    for path in paths:
        parent = path.parent

        while parent != Path("."):
            result.add(parent)
            parent = parent.parent

    return sorted(result, key=lambda p: p.as_posix())


def build_tree(files: Iterable[Path], dirs: Iterable[Path]) -> TreeNode:
    tree = TreeNode()

    for directory in dirs:
        tree.add_dir(directory.parts)

    for file in files:
        tree.add_file(file.parts)

    return tree


def render_tree(
    node: TreeNode,
    prefix: str = "",
    root_label: Optional[str] = None,
    empty_note: Optional[str] = None,
) -> List[str]:
    lines: List[str] = []

    if root_label is not None:
        lines.append(root_label.rstrip("/") + "/")

    entries = node.entries()

    if not entries and empty_note:
        lines.append(empty_note)
        return lines

    for index, (name, is_dir) in enumerate(entries):
        is_last = index == len(entries) - 1
        connector = "└── " if is_last else "├── "
        suffix = "/" if is_dir else ""

        lines.append(f"{prefix}{connector}{name}{suffix}")

        if is_dir:
            child_prefix = prefix + ("    " if is_last else "│   ")
            lines.extend(render_tree(node.dirs[name], child_prefix))

    return lines


def longest_backtick_run(text: str) -> int:
    longest = 0
    current = 0

    for ch in text:
        if ch == "`":
            current += 1
            if current > longest:
                longest = current
        else:
            current = 0

    return longest


def markdown_fence(text: str) -> str:
    return "`" * max(4, longest_backtick_run(text) + 1)


def human_size(num_bytes: int) -> str:
    step = 1024
    suffixes = ["B", "KiB", "MiB", "GiB", "TiB"]
    size = float(num_bytes)

    for suffix in suffixes:
        if size < step or suffix == suffixes[-1]:
            if suffix == "B":
                return f"{int(size)} {suffix}"
            return f"{size:.1f} {suffix}"
        size /= step

    return f"{num_bytes} B"


def decode_bytes(data: bytes) -> str:
    if data.startswith(b"\xff\xfe") or data.startswith(b"\xfe\xff"):
        try:
            return data.decode("utf-16")
        except UnicodeDecodeError:
            pass

    try:
        return data.decode("utf-8-sig")
    except UnicodeDecodeError:
        return data.decode("utf-8", errors="replace")


def read_text_safely(path: Path, max_bytes: int = 0) -> str:
    try:
        size = path.stat().st_size

        if max_bytes > 0 and size > max_bytes:
            return (
                f"[Skipped: file is {human_size(size)}, "
                f"larger than limit {human_size(max_bytes)}]"
            )

        data = path.read_bytes()
        return decode_bytes(data)
    except OSError as exc:
        return f"[Unable to read file: {exc}]"


def build_report(
    root: Path,
    root_label: str,
    include_contents: bool,
    source_extensions: Set[str],
    tree_mode: str,
    max_file_size: int,
    excludes: Set[str],
) -> str:
    root_is_file = root.is_file()
    all_files, all_dirs = scan_all_paths(root, excludes)

    target_files = [
        path
        for path in all_files
        if normalize_extension(path.suffix) in source_extensions
    ]

    if tree_mode == "target":
        tree_files = target_files
        tree_dirs = ancestor_dirs(tree_files)
        empty_note = "(no matching source files found)"
    else:
        tree_files = all_files
        tree_dirs = all_dirs
        empty_note = "(empty)"

    tree = build_tree(tree_files, tree_dirs)

    lines: List[str] = []

    lines.append("# Web Project Source Tree and File Contents")
    lines.append("")
    lines.append(f"- Scanned: `{root.as_posix()}`")
    lines.append(f"- Tree mode: `{tree_mode}`")

    if tree_mode == "target":
        lines.append(f"- Matching source files: `{len(target_files)}`")
    else:
        lines.append(f"- Files in tree: `{len(all_files)}`")
        lines.append(f"- Directories in tree: `{len(all_dirs)}`")
        lines.append(f"- Source files to dump: `{len(target_files)}`")

    ext_list = ", ".join(
        f"`{ext}`" for ext in sorted(source_extensions, key=str.casefold)
    )
    lines.append(f"- Source extensions: {ext_list}")
    lines.append("")

    lines.append("## Directory Tree")
    lines.append("")
    lines.append("```text")
    lines.extend(render_tree(tree, root_label=root_label, empty_note=empty_note))
    lines.append("```")

    if include_contents:
        lines.append("")
        lines.append("## File Contents")
        lines.append("")

        if not target_files:
            lines.append("_No matching source files found._")
        else:
            for rel in target_files:
                abs_path = root if root_is_file else root / rel

                content = read_text_safely(abs_path, max_file_size)
                fence = markdown_fence(content)
                lang = language_for_path(rel)

                try:
                    size = abs_path.stat().st_size
                    header = f"### `{rel.as_posix()}` ({human_size(size)})"
                except OSError:
                    header = f"### `{rel.as_posix()}`"

                lines.append(header)
                lines.append("")
                lines.append(f"{fence}{lang}")

                if content.strip("\r\n"):
                    lines.append(content.rstrip("\r\n"))

                lines.append(fence)
                lines.append("")

    return "\n".join(lines).rstrip("\n") + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Recursively scan a web/Bun project folder, show the directory tree "
            "(ignoring node_modules, dist, etc.), and dump HTML, CSS, JS, TS files."
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python web_report.py .
  python web_report.py ./my-bun-app --stdout
  python web_report.py ./my-bun-app -o web_report.md
  python web_report.py . --ext .ts --ext .tsx --ext .css
  python web_report.py . --tree-mode target
        """.strip(),
    )

    parser.add_argument(
        "folder",
        nargs="?",
        default=".",
        type=Path,
        help="Folder or file to scan. Defaults to the current folder.",
    )

    parser.add_argument(
        "-o",
        "--output",
        type=Path,
        default=None,
        help="Write the report to this file. Default: web_report.md",
    )

    parser.add_argument(
        "--stdout",
        action="store_true",
        help="Print the report to standard output instead of writing a file.",
    )

    parser.add_argument(
        "--root-name",
        default=None,
        help="Name to display as the tree root. Default: scanned folder name.",
    )

    parser.add_argument(
        "--no-contents",
        action="store_true",
        help="Generate only the directory tree, without dumping file contents.",
    )

    parser.add_argument(
        "-e",
        "--ext",
        action="append",
        metavar="EXT",
        help=(
            "Extension whose contents should be dumped. Repeatable. "
            "Default: .html, .css, .js, .ts, .jsx, .tsx, .json."
        ),
    )

    parser.add_argument(
        "--exclude",
        action="append",
        metavar="DIR",
        help="Additional directory name to ignore during scanning. Repeatable.",
    )

    parser.add_argument(
        "--tree-mode",
        choices=("all", "target"),
        default="all",
        help=(
            "Tree contents: 'all' shows every file/folder found; "
            "'target' shows only files matching --ext and their parent folders. "
            "Default: all."
        ),
    )

    parser.add_argument(
        "--max-file-size",
        type=int,
        default=0,
        metavar="BYTES",
        help="Skip dumping contents for files larger than this many bytes. Default: 0 (no limit).",
    )

    args = parser.parse_args()

    if hasattr(sys.stdout, "reconfigure"):
        try:
            sys.stdout.reconfigure(encoding="utf-8")
        except Exception:
            pass

    root = args.folder.expanduser().resolve()

    if not root.exists():
        print(f"error: path does not exist: {root}", file=sys.stderr)
        return 2

    if root.is_file():
        default_root_label = root.parent.name or "."
    elif root.is_dir():
        default_root_label = root.name or "."
    else:
        print("error: path is neither a file nor a directory", file=sys.stderr)
        return 2

    root_label = args.root_name or default_root_label
    source_extensions = parse_extensions(args.ext)
    custom_excludes = set(args.exclude) if args.exclude else set()

    report = build_report(
        root=root,
        root_label=root_label,
        include_contents=not args.no_contents,
        source_extensions=source_extensions,
        tree_mode=args.tree_mode,
        max_file_size=max(0, args.max_file_size),
        excludes=custom_excludes,
    )

    if args.stdout:
        sys.stdout.write(report)
        return 0

    output_path = args.output or Path("web_report.md")

    try:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(report, encoding="utf-8")
    except OSError as exc:
        print(f"error: could not write output file: {exc}", file=sys.stderr)
        return 1

    print(f"Wrote report to: {output_path.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())