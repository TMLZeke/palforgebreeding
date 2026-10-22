import { useEffect, useId, useMemo, useRef, useState } from "react";
import { asset } from "../lib/assets";
import { formatDex, rarityLabel, searchPals } from "../lib/breeding";
import type { Dataset, Pal } from "../lib/types";
import { useClickOutside } from "../lib/useClickOutside";
import { BossTag } from "./BossTag";

type Props = {
  dataset: Dataset;
  value: number | null;
  onChange: (id: number | null) => void;
  label: string;
  placeholder?: string;
  allowClear?: boolean;
};

export function PalSelect({
  dataset,
  value,
  onChange,
  label,
  placeholder = "Search pals…",
  allowClear = true,
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const idBase = useId();
  const labelId = `${idBase}-label`;
  const listboxId = `${idBase}-listbox`;
  const optionId = (i: number) => `${idBase}-option-${i}`;
  const selected = value !== null ? dataset.pals[value] : null;

  useClickOutside(rootRef, () => setOpen(false), open);

  const results = useMemo(
    () => searchPals(dataset, query).slice(0, 40),
    [dataset, query],
  );

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    rootRef.current
      ?.querySelector(".pal-select-menu li button.active")
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function choose(id: number) {
    onChange(id);
    setQuery("");
    close();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = results[activeIndex];
      if (pick) choose(pick.id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  }

  return (
    <div className="pal-select" ref={rootRef}>
      <span className="field-label" id={labelId}>
        {label}
      </span>
      <div className="pal-select-control">
        <button
          ref={triggerRef}
          type="button"
          className={`pal-select-trigger ${selected ? "has-value" : ""}`}
          aria-label={`${label}: ${selected ? selected.name : "none selected"}`}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {selected ? (
            <PalChip pal={selected} withInfo={false} />
          ) : (
            <span className="placeholder">{placeholder}</span>
          )}
          <span className="chevron" aria-hidden>
            ▾
          </span>
        </button>
        {allowClear && selected && (
          <button
            type="button"
            className="clear-btn"
            onClick={() => {
              onChange(null);
              triggerRef.current?.focus();
            }}
            aria-label={`Clear ${label}`}
          >
            ×
          </button>
        )}
      </div>
      {open && (
        <div className="pal-select-menu">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            role="combobox"
            aria-label={`Search ${label}`}
            aria-autocomplete="list"
            aria-expanded="true"
            aria-controls={listboxId}
            aria-activedescendant={
              results.length > 0 ? optionId(activeIndex) : undefined
            }
          />
          <ul id={listboxId} role="listbox" aria-labelledby={labelId}>
            {results.map((pal, i) => (
              <li key={pal.id}>
                <button
                  id={optionId(i)}
                  type="button"
                  tabIndex={-1}
                  role="option"
                  aria-selected={i === activeIndex}
                  className={i === activeIndex ? "active" : ""}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => choose(pal.id)}
                >
                  <PalChip pal={pal} withInfo={false} />
                  <span className="meta">BP {pal.breedingPower}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function PalChip({
  pal,
  withInfo = true,
  onNameClick,
}: {
  pal: Pal;
  withInfo?: boolean;
  onNameClick?: (pal: Pal) => void;
}) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const chipRef = useRef<HTMLSpanElement>(null);
  const popoverId = useId();
  const showInfo = withInfo && (hovered || pinned);

  useClickOutside(wrapRef, () => setPinned(false), withInfo && pinned);

  useEffect(() => {
    if (!showInfo) return;

    function reposition() {
      const rect = chipRef.current?.getBoundingClientRect();
      if (!rect) return;
      const popoverWidth = Math.min(320, window.innerWidth * 0.85);
      const left = Math.min(
        rect.left,
        window.innerWidth - popoverWidth - 8,
      );
      setPos({ top: rect.bottom + 8, left: Math.max(8, left) });
    }

    reposition();
    document.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [showInfo]);

  const interactive = withInfo || Boolean(onNameClick);

  function activate(e: React.SyntheticEvent) {
    if (onNameClick) {
      e.stopPropagation();
      onNameClick(pal);
      return;
    }
    if (!withInfo) return;
    e.stopPropagation();
    setPinned((p) => !p);
  }

  // The popover is a sibling of the chip, not a child: content inside a
  // role="button" is hidden from screen readers, and as the next node in
  // reading order it is announced right after the chip.
  return (
    <span
      className="pal-chip-wrap"
      ref={wrapRef}
      onMouseEnter={() => withInfo && setHovered(true)}
      onMouseLeave={() => withInfo && setHovered(false)}
    >
      <span
        className={`pal-chip ${interactive ? "has-info" : ""} ${onNameClick ? "is-link" : ""}`}
        ref={chipRef}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-expanded={withInfo && !onNameClick ? showInfo : undefined}
        aria-controls={showInfo ? popoverId : undefined}
        aria-label={
          onNameClick
            ? `${pal.name}: view locations`
            : withInfo
              ? `${pal.name}: show details`
              : undefined
        }
        onClick={activate}
        onKeyDown={(e) => {
          if (!interactive) return;
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            activate(e);
          } else if (e.key === "Escape" && pinned) {
            e.stopPropagation();
            setPinned(false);
          }
        }}
      >
        <img
          className="pal-icon"
          src={asset(`icons/${pal.internalName}.png`)}
          alt=""
          loading="lazy"
          width={28}
          height={28}
        />
        <span className="dex">#{formatDex(pal)}</span>
        <span className="name">{pal.name}</span>
      </span>
      {showInfo && pos && <PalInfoPopover id={popoverId} pal={pal} pos={pos} />}
    </span>
  );
}

function PalInfoPopover({
  id,
  pal,
  pos,
}: {
  id: string;
  pal: Pal;
  pos: { top: number; left: number };
}) {
  const workEntries = Object.entries(pal.work);
  return (
    <span
      id={id}
      role="group"
      aria-label={`${pal.name} details`}
      className="pal-info-popover"
      style={{ position: "fixed", top: pos.top, left: pos.left }}
      onClick={(e) => e.stopPropagation()}
    >
      <span className="pal-info-head">
        <img
          className="pal-icon"
          src={asset(`icons/${pal.internalName}.png`)}
          alt=""
          width={40}
          height={40}
        />
        <span>
          <strong>{pal.name}</strong>
          <span className="dex"> #{formatDex(pal)}</span>
          <BossTag pal={pal} />
        </span>
      </span>
      <dl className="pal-info-stats">
        <div>
          <dt>Rarity</dt>
          <dd>{rarityLabel(pal.rarity)}</dd>
        </div>
        <div>
          <dt>Breeding power</dt>
          <dd>{pal.breedingPower}</dd>
        </div>
        <div>
          <dt>Stats</dt>
          <dd>
            HP {pal.hp} / Atk {pal.attack} / Def {pal.defense}
          </dd>
        </div>
      </dl>
      {workEntries.length > 0 && (
        <div className="work-row">
          {workEntries.map(([k, v]) => (
            <span key={k}>
              {k} {v}
            </span>
          ))}
        </div>
      )}
      {pal.ability && (
        <p className="pal-info-ability">
          <strong>{pal.ability.name}</strong>
          <span className="pal-info-ability-tag">Partner Skill</span>
          <br />
          {pal.ability.description}
        </p>
      )}
      {pal.flavorText && <p className="pal-info-flavor">{pal.flavorText}</p>}
      {!pal.ability && !pal.flavorText && (
        <p className="hint">No flavor text / ability data for this Pal yet.</p>
      )}
    </span>
  );
}

type MultiProps = {
  dataset: Dataset;
  values: number[];
  onChange: (ids: number[]) => void;
  label: string;
};

export function PalMultiSelect({
  dataset,
  values,
  onChange,
  label,
}: MultiProps) {
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = new Set(values);
  const results = useMemo(
    () => searchPals(dataset, query).slice(0, 30),
    [dataset, query],
  );

  useClickOutside(rootRef, () => setQuery(""), query.trim().length > 0);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    rootRef.current
      ?.querySelector(".pal-multi-results li button.active")
      ?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  function toggle(id: number) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next].sort((a, b) => a - b));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const pick = results[activeIndex];
      if (pick) toggle(pick.id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setQuery("");
    }
  }

  return (
    <div className="pal-multi" ref={rootRef}>
      <span className="field-label">{label}</span>
      <div className="pal-multi-selected">
        {values.length === 0 && (
          <span className="hint">None yet — add pals you already have</span>
        )}
        {values.map((id) => (
          <button
            key={id}
            type="button"
            className="tag"
            aria-label={`Remove ${dataset.pals[id].name}`}
            onClick={() => toggle(id)}
          >
            <PalChip pal={dataset.pals[id]} withInfo={false} /> ×
          </button>
        ))}
      </div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Add owned pal…"
        aria-label={`${label}: add a Pal`}
      />
      {query.trim() && (
        <ul className="pal-multi-results">
          {results.map((pal, i) => (
            <li key={pal.id}>
              <button
                type="button"
                className={i === activeIndex ? "active" : ""}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => toggle(pal.id)}
              >
                <PalChip pal={pal} withInfo={false} />
                <span>{selected.has(pal.id) ? "Remove" : "Add"}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}