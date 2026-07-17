# Planscope — design direction

## 1. Aesthetic direction

**Swiss-grid modernist.** Planscope reads like a technical diagnostic instrument, not a SaaS
dashboard: a stark, light grid, thin black rules, boxy geometric type, and exactly one loud
color — signal red — reserved entirely for the node burning your runtime. Structure and
restraint are the personality; the red only shows up where it means something.

This is deliberately a **light, cool-neutral grid** — distinct from the recent run of dark
instrument panels (Erosion's brass/slate, Flagcraft's CRT near-black, Spigot's blueprint navy)
and from Ringwood's warm parchment. No recent ship has used a light swiss-grid direction or a
red/ink-blue palette.

## 2. Tokens

| Token | Value | Use |
|---|---|---|
| `--bg` | `#F2F3F5` | page background — cool light grey, never pure white |
| `--surface` | `#FAFAF9` | panels, cards |
| `--surface-2` | `#E7E9ED` | recessed areas — the tree canvas well, input chrome |
| `--text` | `#14161A` | primary ink |
| `--muted` | `#6B7280` | secondary text, node metadata |
| `--accent` | `#D6331B` | signal red — the hotspot highlight, primary CTA, focus ring |
| `--accent-support` | `#1D4ED8` | ink-blue — row-estimate mismatch flags, links, secondary state |
| `--success` | `#15803D` | plan parsed cleanly, estimate matches actual |
| `--danger` | `#D6331B` | parse error (shares the accent — an error *is* a hotspot on the input) |
| Display font | [Archivo](https://fonts.google.com/specimen/Archivo) (800/900) | wordmark, headings — a dense geometric grotesk with real weight |
| UI / data font | [Space Mono](https://fonts.google.com/specimen/Space+Mono) | tree node labels, cost/row numbers, inputs — fixed-width so columns of numbers align |
| Spacing unit | 8px scale (8/16/24/32/48/64) | all layout spacing |
| Corner radius | 2px | sharp, drafting-table edges — never soft/rounded |
| Depth | flat by default; a hard 4px offset shadow in `--text` (poster-style, not blurred) on the active/selected tree node and on raised panels | |
| Motion | UI transitions 150ms ease-out; the tree's collapse/expand and the hotspot reveal run at 200ms ease-out | |

## 3. Layout intent

The **cost tree is the hero**. Desktop (1440×900): a slim 320px left rail holds the engine
select and the EXPLAIN input (collapsible once a plan is parsed), and the tree fills the
remaining ~75% of the viewport at full height — no fixed-pixel canvas, it grows with the
window. Phone (390×844): input stacks on top as a collapsible panel (collapsed by default once
a plan exists, so the tree gets the screen), tree below fills the remaining viewport with
horizontal scroll for deep nesting rather than illegible shrinking text.

## 4. Signature detail

On parse, the wordmark's "scope" gets a **1px red rule that sweeps left-to-right underneath it**
in ~400ms, then the tree's hottest node's highlight animates in with the same sweep — the same
motion that "reveals" the wordmark is the motion that reveals the answer. One flourish, reused
with intent instead of two separate gimmicks.
