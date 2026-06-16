import { useEffect, useRef, useState } from "react";
import { dataService } from "./services";
import { localBio } from "./localBio";
import type { MemoryState, UniversityBio, UniversityData } from "./types";

interface BioState {
  bio: UniversityBio | null;
  loading: boolean;
  fallback: boolean; // true when the built-in profile is shown (AI unavailable)
}

// Fetches a personalised AI decision profile; falls back to a built-in profile
// (composed from existing data) if the AI is unavailable, so the page still works.
export function useUniversityBio(
  uni: UniversityData | undefined,
  memory: MemoryState,
): BioState & { retry: () => void } {
  const [state, setState] = useState<BioState>({ bio: null, loading: false, fallback: false });
  const [nonce, setNonce] = useState(0);
  const reqId = useRef(0);

  useEffect(() => {
    if (!uni) return;
    const id = ++reqId.current;
    setState({ bio: null, loading: true, fallback: false });

    dataService
      .universityBio(uni, memory)
      .then((bio) => {
        if (id === reqId.current) setState({ bio, loading: false, fallback: false });
      })
      .catch((err: Error) => {
        console.error("University bio AI unavailable, using built-in profile:", err.message);
        if (id === reqId.current) setState({ bio: localBio(uni, memory), loading: false, fallback: true });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uni?.name, memory.avoidedPaths.length, memory.preferredPaths.length, memory.goals.length, nonce]);

  return { ...state, retry: () => setNonce((n) => n + 1) };
}
