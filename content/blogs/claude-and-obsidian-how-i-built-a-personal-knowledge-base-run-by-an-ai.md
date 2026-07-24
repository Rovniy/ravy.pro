---
title: 'Claude and Obsidian: How I Built a Personal Knowledge Base Run by an AI'
description: 'I keep my knowledge base in Obsidian and put a Claude Code agent on top: it lives in the notes folder, knows my rules, and handles the routine for me.'
image: /blog-cover/claude_and_obsidian_how_i_built_a_personal_knowledge_base_run_by_an_ai.webp
ogImage: /blog-opengraph/claude-and-obsidian_-how-i-built-a-personal-knowledge-base-run-by-an-ai.png
tags:
  - ai
  - dev
published: true
createdAt: 2026-07-08T18:49:38.753Z
lastUpdated: 2026-07-08T18:50:02.807Z
---

## The problem this solves

I have 258 markdown notes: projects, a journal, finances, trips, ideas, references. Any base like this eventually turns into a swamp. You dump something into the inbox, forget to file it, lose the links between notes, and the structure drifts. Most people fight this with willpower or yet another methodology. I did it differently: I put an AI agent on top of the base that knows the rules and keeps order for me.

This is the pairing of Obsidian plus Claude Code. Not a browser chat where you paste text, but an agent that works directly in the notes folder: it reads, edits, creates notes, and runs scripts.

## Why this specific pair

Obsidian is good because it is just a folder of markdown files on disk. No proprietary database, no cloud middleman. A note is a plain text file you can open with anything. That is exactly why it is safe to let an agent near it.

Claude Code is not a chatbot but a command-line agent. You launch it inside a folder and it gets file access: it searches, reads, writes, and runs terminal commands. For a knowledge base this shape is ideal, because the whole base is a folder of files under git.

The pairing covers the weak spot of each tool. Obsidian on its own does nothing and waits for you to file and link everything by hand. A bare AI chat does not remember your structure and starts from zero every time. Together they give you a base that maintains itself by your rules.

## How it works technically

Three components.

First. The base in Obsidian is an ordinary folder on disk under git. Git here is not a luxury but insurance. I see every edit the agent makes through `git diff` and can roll it back. The agent physically cannot quietly corrupt notes: everything stays in history.

Second. Claude Code runs in the root of that folder and sees the whole file tree.

Third, and most important. A file named `CLAUDE.md` sits in the root. It is the constitution of the base. The agent reads it on every launch and must follow what is written there: folder structure, note style, language, what may and may not be touched.

The whole point of the pairing is not the model but this file. Without it the agent is smart but does not know my habits. With it the agent behaves like an assistant who has worked with me for a year.

## CLAUDE.md: the heart of the system

Here is what is actually written there, because that is the recipe. A trimmed excerpt:

```markdown
## Folder structure

- `00 Inbox/` - raw notes, quick captures.
- `01 Daily/` - daily notes, events, journal.
- `02 Projects/` - active projects with outcomes and tasks.
- `03 Areas/` - long-term areas of life and work.
- `04 Resources/` - references, learning notes, concepts.
- `05 Archive/` - inactive or completed material.
- `Maps/` - Map of Content notes and high-level indexes.

## Safety rules

- Never delete notes unless I explicitly ask.
- Never mass-rename files without showing a plan first.
- Never move more than 10 files without confirmation.
- Never overwrite original notes when summarizing. Create a new note instead.
- Before large structural changes, show a plan and wait for approval.
- Do not touch secrets, API keys, passwords, tokens, or credentials.
```

Those safety lines turn a potentially dangerous tool into a safe one. The agent could wipe half the base with a single command, but the rules force it to show a plan first and wait for my yes.

There is also a privacy block. I keep a folder with a personal profile. `CLAUDE.md` states the agent may read it when reasoning about my goals, but never lets it leak out: not into git commits, not into calendar descriptions, not into exports. This is an example of how a text rule sets boundaries the agent respects.

## Command phrases instead of clicking

This is the nicest part in daily use. In `CLAUDE.md` I described working phrases, each backed by a ready procedure. I just type the phrase and the agent knows the whole flow.

* Sort the inbox. It reads `00 Inbox`, proposes where each note goes, plus links and tags, and waits for confirmation before moving files.
* What is next. It walks the active projects, collects the Next actions sections and open questions, and returns a short prioritized to-do list.
* Make a finance snapshot. It takes the template, creates a monthly snapshot note, totals accounts in their source currency and in USD, and never invents numbers, leaving blanks instead.
* Collect calendar tasks. It scans the base for lines tagged as calendar tasks, pulls out date, time, duration, and description, and groups them by date.

A key detail: the agent shows a plan first and waits. That way I stay the one making decisions, and the routine goes to the agent.

## Case 1. Producing an animated series

The most telling example, where the pairing stops being a smart notebook and becomes a production pipeline. I have an animation project: a short wordless cozy series that I assemble through AI video generation. The whole production lives in the base as a project with subfolders like `Bible`, `Characters`, `World`, `Story`, `Production`, `Media`, `Channel`, and `Blog`.

The trouble with such projects is that quality rests on dozens of small rules. How to light a shot, how to move the camera, how not to break a character's look from frame to frame, what to write in the prompt for the generator. Holding all that in your head is impossible, and forgetting one item makes the picture drift.

The solution is skills. A skill is a folder with an instruction the agent loads only when it works on that topic. This project has five: write an episode, build a prompt for a specific shot, create a new character, QC a prompt for mistakes before generation, and a general operating layer over the `Production` folder. `Production` itself holds human-readable guides: directing, cinematography, lighting, editing, VFX, a shot authoring standard, and a shot list template.

How it works in practice. I ask for a scene of an episode. The agent invokes the right skill, reads the guides, writes the script, breaks it into shots per the authoring standard, and generates prompts. Throughout it holds the project's hard invariants: a single style, character consistency, camera and light rules. A separate rule forces it to always attach character references from the `Media` folder when generating images or video, otherwise a hero's look drifts.

Another stream is short clips. Every short prompt is saved by protocol into `Story/Shorts` with a filename made of the date and the beat of the clip, plus metadata for publishing across platforms:

```markdown
02 Projects/Tiny Boo Movie/Story/Shorts/
  2026-06-11 - Meet Boo waking up in a giant world.md
  2026-06-11 - Boo meets Marci in the firefly dusk.md
  2026-06-17 - Boo finds the whole world in a dewdrop.md
  2026-06-20 - Boo can't lift the giant berry.md
```

There are already more than a dozen ready prompts there. This turned scattered ideas into a queue of generation-ready content.

What it gave me. The heavy production routine is automated and standardized, while I keep creative control. The quality bar is fixed in the guides, not in my memory, so it does not drop when I am tired.

## Case 2. Travel notes

The opposite in spirit, where speed matters less than order and not losing anything. I move around a lot, and part of my trips are visa matters with documents, deadlines, and dates I cannot afford to forget.

The structure is strict and described in `CLAUDE.md`. Each trip is a folder like `MM.YYYY - Destination` inside `03 Areas/Travels`. It holds two files: `Raw Notes` for scribbles made on the road, and `Summary` as the clean writeup. Every summary must carry start and end date properties, place, status, and budget:

```yaml
---
type: travel
status: done
created: 2026-05-01
updated: 2026-05-28
дата_от: 2026-05-17
дата_до: 2026-05-24
место: Destination
tags:
  - travel
  - visa
---
```

How it works. On the trip I dump fragments into `Raw Notes`: what I did, what I applied for, what I spent. Back home I say to write up the trip. The agent reads the raw notes and assembles the `Summary` in one shape: a short recap, trip goals with done markers, a document checklist, a dated timeline with deadlines, finances, next actions, and open questions. It does not touch the original `Raw Notes`; the clean version is a new note.

Then two bonuses. First, inside the summary the agent creates calendar tasks in a plain-text format, including a reminder for the next trip with a computed date:

```markdown
- [ ] Plan the next trip #calendar
  дата: 2026-11-20
  время:
  длительность:
  календарь: Personal
  локация: Destination
  описание: 180 days since return. Check visa statuses and book tickets and lodging.
  источник: [[03 Areas/Travels/05.2026 - Destination/Summary]]
```

Later a single sync command turns these into Google Calendar events. Second, the agent updates the shared travel map in `Maps`, adding the trip with dates and status. So I always have one page with all trips and their state, not a dozen scattered notes.

What it gave me. Visa deadlines and next steps no longer get lost, because each one is pushed into the timeline, into open questions, and into the calendar. The summary assembles in a minute from messy notes instead of being written from scratch at night when I am out of energy.

## Other scenarios from practice

* Finances. Once a month, the command to make a finance snapshot. The agent creates a note in a single format, I fill in current numbers, and it updates the finance map and tracks the trend across months.
* Projects. In the morning I type what is next and get a list: what is on fire in each project and what open questions are hanging. This replaced my manual project walk.
* Inbox. I dump thoughts during the day and in the evening say to sort the inbox. The agent proposes a layout, I confirm. The inbox does not pile up for months.

## Automation: scripts and hooks

Google Calendar sync. A folder of scripts holds a Python script of a couple hundred lines that walks the whole base, finds tasks tagged as calendar tasks with their neighboring fields, and pushes them into Google Calendar through the API. It is done carefully: events are hashed so a rerun does not create duplicates, and the time zone is respected. It works like this: I say to sync Google Calendar, the agent first shows the list of upcoming events, and only after my confirmation does the real push.

Secret protection through a hook. The base holds API credential files that must never be committed to git. I do not rely on the agent's memory. I set up a hook: a small script that Claude Code runs automatically before every terminal command. If the command contains `git commit`, `add`, or `push` and touches a secret file, the hook blocks it. Here is the real hook:

```python
#!/usr/bin/env python3
"""Pre-tool hook: block git commit/add that would stage secret files.

Reads Claude Code hook payload from stdin (JSON with tool_name/tool_input).
Exits 0 to allow, 2 to block (stderr is fed back to the model).
"""
import json, re, subprocess, sys

SECRET_PATTERNS = (r"credentials\.json", r"token\.json", r"\.calendar-token\.json")
SECRET_RE = re.compile("|".join(SECRET_PATTERNS))

def main() -> int:
    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0

    cmd = (payload.get("tool_input") or {}).get("command", "") or ""
    if not re.search(r"\bgit\s+(commit|add|push)\b", cmd):
        return 0

    if SECRET_RE.search(cmd):
        print(f"BLOCKED: command references secret file(s): {cmd}", file=sys.stderr)
        return 2

    result = subprocess.run(
        ["git", "diff", "--cached", "--name-only"],
        capture_output=True, text=True, timeout=5,
    )
    bad = [line for line in result.stdout.splitlines() if SECRET_RE.search(line)]
    if bad:
        print("BLOCKED: secret file(s) staged: " + ", ".join(bad), file=sys.stderr)
        return 2

    return 0

if __name__ == "__main__":
    sys.exit(main())
```

The difference between the two levels matters. Rules in `CLAUDE.md` are instructions the agent follows. Hooks are code that runs independently of the agent's will. For truly dangerous things I use hooks; for everything else, rules.

## Bases: live tables on top of notes

Bases is a built-in Obsidian feature for building table views. I have views for active projects, business ideas, finance snapshots, the inbox, and waiting items. When the agent creates a note, it fills in the correct frontmatter fields, and the note automatically lands in the right table. I get a dashboard without assembling it by hand.

## Memory across sessions

The agent has a separate file-based memory: a set of small files, each holding a single fact. Who I am by role, what time zone I work in, which work approaches I dislike, which decisions we already made on projects. I do not have to re-explain context every time. A new session starts not from zero but from accumulated knowledge.

## Setting it up from scratch

1. Install Obsidian and create a vault, an ordinary folder. Run `git init` in it. That gives you rollback of any change.
2. Install Claude Code and launch it in the root of the vault folder.
3. Create a `CLAUDE.md` file in the root. This is the key step. Describe the folder structure, the note language, the style and required frontmatter fields, the safety rules, and what must not be touched. You can ask the agent itself to draft this file from your base, then edit it.
4. Add templates in a `Templates` folder so projects, trips, and snapshots share one shape, and note in `CLAUDE.md` which template is for what.
5. Add working phrases. Describe commands like sort the inbox or what is next right in `CLAUDE.md` and spell out what the agent does for each.
6. When a repeating technical routine appears, move it into a script and teach the agent to run it. For dangerous operations, add a hook.
7. As the base grows, add skills for complex projects so their specifics do not clutter the general rules.

Start with the first three points. A well-written `CLAUDE.md` alone is enough to feel the difference.

## Honest about the downsides

This is not magic. The agent sometimes reads a task more broadly than needed, so the show-a-plan-and-wait mode is mandatory, especially at the start. Git is not a luxury but a necessity: without change history it is scary to trust edits to an automaton. And the pairing takes an upfront investment of time in writing rules. The first week you configure more than you save. The payoff comes later.

## Takeaway

The value is not that an AI writes my notes for me. The value is that the base stopped degrading. It used to rest on my discipline and fell apart the moment I got busy. Now order rests on the rules in `CLAUDE.md`, and the agent maintains it. I think and decide; it files, links, and automates. Obsidian gives an open format it is safe to let an AI near, and Claude turns a static folder of text into a living system that works by my rules and knows my context.
