"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  BIBLE_VERSIONS,
  DEFAULT_BIBLE_VERSION_ID,
  getBibleVersion,
  hasInAppText,
  isBibleVersionId,
  type BibleVersion,
} from "@/lib/bible/versions";

const STORAGE_KEY = "meditate-bible-version";

type BibleVersionContextValue = {
  version: BibleVersion;
  setVersionId: (id: string) => void;
};

const BibleVersionContext = createContext<BibleVersionContextValue>({
  version: getBibleVersion(DEFAULT_BIBLE_VERSION_ID),
  setVersionId: () => {},
});

export function BibleVersionProvider({ children }: { children: ReactNode }) {
  const [versionId, setVersionIdState] = useState(DEFAULT_BIBLE_VERSION_ID);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isBibleVersionId(saved)) {
      setVersionIdState(saved);
    }
  }, []);

  const value = useMemo<BibleVersionContextValue>(() => {
    return {
      version: getBibleVersion(versionId),
      setVersionId: (id: string) => {
        if (!isBibleVersionId(id)) return;
        setVersionIdState(id);
        window.localStorage.setItem(STORAGE_KEY, id);
      },
    };
  }, [versionId]);

  return (
    <BibleVersionContext.Provider value={value}>
      {children}
    </BibleVersionContext.Provider>
  );
}

export function useBibleVersion() {
  return useContext(BibleVersionContext);
}

export function BibleVersionSelect() {
  const { version, setVersionId } = useBibleVersion();
  const inApp = hasInAppText(version);

  return (
    <div className="mt-4">
      <label
        htmlFor="bible-version"
        className="text-sm font-medium text-stone-800"
      >
        Bible version
      </label>
      <select
        id="bible-version"
        className="mt-1 w-full rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-stone-900 focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/20 sm:max-w-md"
        value={version.id}
        onChange={(event) => setVersionId(event.target.value)}
      >
        {BIBLE_VERSIONS.map((item) => (
          <option key={item.id} value={item.id}>
            {item.abbreviation} — {item.name}
          </option>
        ))}
      </select>
      <p className="mt-2 text-sm text-stone-700">
        You are reading the <span className="font-medium">{version.name}</span>{" "}
        ({version.abbreviation}).
      </p>
      {!inApp ? (
        <p className="mt-1 text-xs text-stone-500">
          This licensed edition opens on Bible Gateway. WEB and KJV can be read
          and heard in the app, including offline.
        </p>
      ) : null}
    </div>
  );
}
