"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useLibrary, useLibraryAlpha, useLibraryByCategory } from "@/lib/hooks";
import { deleteLibraryExercise, findOrCreateLibraryExercise, renameLibraryExercise } from "@/lib/library";
import type { LibraryExercise } from "@/lib/db";
import { LIBRARY_SORTS, useUIStore, type LibrarySort } from "@/lib/store";

export function LibraryList() {
  const t = useTranslations("library");
  const tCommon = useTranslations("common");
  const tCategory = useTranslations("exerciseCategory");
  const sort = useUIStore((s) => s.librarySort);
  const setSort = useUIStore((s) => s.setLibrarySort);

  const recent = useLibrary();
  const alpha = useLibraryAlpha();
  const grouped = useLibraryByCategory();

  const [filter, setFilter] = useState("");
  const [busy, setBusy] = useState(false);

  const onCreate = async () => {
    setBusy(true);
    try {
      await findOrCreateLibraryExercise(filter);
      setFilter("");
      toast.success(tCommon("saved"));
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setBusy(false);
    }
  };

  const flat = alpha ?? recent ?? [];
  const trimmedFilter = filter.trim();
  const exactMatch = flat.find(
    (e) => e.name.trim().toLowerCase() === trimmedFilter.toLowerCase(),
  );
  const showCreate = trimmedFilter.length > 0 && !exactMatch;

  const filterList = (list: LibraryExercise[]): LibraryExercise[] => {
    if (!trimmedFilter) return list;
    const q = trimmedFilter.toLowerCase();
    return list.filter((e) => e.name.toLowerCase().includes(q));
  };

  return (
    <div className="mt-4 space-y-3">
      {/* Search + create */}
      <div className="flex gap-2">
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder={t("filterPlaceholder")}
          className="flex-1 rounded-md border border-border bg-bg-elev px-3 py-2 text-sm placeholder:text-fg-muted focus:border-accent focus:outline-none"
        />
        {showCreate && (
          <button
            type="button"
            onClick={onCreate}
            disabled={busy}
            data-tap
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-fg disabled:opacity-50"
          >
            + {t("create")}
          </button>
        )}
      </div>

      {/* Sort toggle */}
      <div className="inline-flex rounded-md border border-border bg-bg-elev p-1">
        {LIBRARY_SORTS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSort(s)}
            data-tap
            className={[
              "rounded px-3 py-1 text-xs transition-colors",
              sort === s
                ? "bg-bg text-fg shadow-sm"
                : "text-fg-muted hover:text-fg",
            ].join(" ")}
          >
            {t(`sort.${s}`)}
          </button>
        ))}
      </div>

      {/* Body */}
      {sort === "category" ? (
        <CategoryView
          groups={grouped}
          filter={trimmedFilter}
          filterList={filterList}
          tCategory={tCategory}
          t={t}
        />
      ) : (
        <FlatView
          list={sort === "alpha" ? alpha : recent}
          filtered={filterList(sort === "alpha" ? alpha ?? [] : recent ?? [])}
          hasFilter={trimmedFilter.length > 0}
          t={t}
        />
      )}
    </div>
  );
}

function FlatView({
  list,
  filtered,
  hasFilter,
  t,
}: {
  list: LibraryExercise[] | undefined;
  filtered: LibraryExercise[];
  hasFilter: boolean;
  t: (k: string) => string;
}) {
  if (list === undefined) {
    return <div className="text-fg-muted text-sm">…</div>;
  }
  if (filtered.length === 0) {
    return (
      <p className="text-fg-muted text-sm">
        {hasFilter ? t("noMatches") : t("empty")}
      </p>
    );
  }
  return (
    <ul className="space-y-2">
      {filtered.map((ex) => (
        <li key={ex.id}>
          <LibraryRow exercise={ex} />
        </li>
      ))}
    </ul>
  );
}

function CategoryView({
  groups,
  filter,
  filterList,
  tCategory,
  t,
}: {
  groups: { category: string | null; items: LibraryExercise[] }[] | undefined;
  filter: string;
  filterList: (l: LibraryExercise[]) => LibraryExercise[];
  tCategory: (k: string) => string;
  t: (k: string) => string;
}) {
  if (groups === undefined) {
    return <div className="text-fg-muted text-sm">…</div>;
  }

  // Apply filter within each group.
  const filteredGroups = groups
    .map((g) => ({ ...g, items: filterList(g.items) }))
    .filter((g) => g.items.length > 0);

  if (filteredGroups.length === 0) {
    return (
      <p className="text-fg-muted text-sm">
        {filter ? t("noMatches") : t("empty")}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {filteredGroups.map((g) => (
        <div key={g.category ?? "other"}>
          <h3 className="text-xs font-medium text-fg-muted uppercase tracking-wider">
            {g.category ? tCategory(g.category) : tCategory("other")}
          </h3>
          <ul className="mt-2 space-y-2">
            {g.items.map((ex) => (
              <li key={ex.id}>
                <LibraryRow exercise={ex} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function LibraryRow({ exercise }: { exercise: LibraryExercise }) {
  const t = useTranslations("library");
  const tCommon = useTranslations("common");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(exercise.name);
  const [busy, setBusy] = useState(false);

  const onSave = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === exercise.name) {
      setEditing(false);
      setDraft(exercise.name);
      return;
    }
    setBusy(true);
    try {
      await renameLibraryExercise(exercise.id, trimmed);
      setEditing(false);
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async () => {
    if (!confirm(t("deleteConfirm", { name: exercise.name }))) return;
    setBusy(true);
    try {
      await deleteLibraryExercise(exercise.id);
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border bg-bg-elev px-3 py-2">
      {editing ? (
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={onSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") onSave();
            if (e.key === "Escape") {
              setDraft(exercise.name);
              setEditing(false);
            }
          }}
          autoFocus
          className="flex-1 rounded border border-border bg-bg px-2 py-1 text-sm"
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex-1 text-left text-sm hover:text-accent"
        >
          {exercise.name}
          {!exercise.is_standard && (
            <span className="ml-2 text-fg-muted text-xs">
              · {t("custom")}
            </span>
          )}
        </button>
      )}
      <button
        type="button"
        onClick={onDelete}
        disabled={busy}
        aria-label={tCommon("delete")}
        className="text-fg-muted hover:text-danger px-2 disabled:opacity-50"
      >
        ×
      </button>
    </div>
  );
}