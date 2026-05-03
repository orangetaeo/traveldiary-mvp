"use client";

import { useEffect } from "react";
import { addReceivedKey } from "@/lib/share/receivedKeys";

interface Props {
  shareKey: string;
  destination?: string;
  nights?: number;
}

export function ReceivedKeyTracker({ shareKey, destination, nights }: Props) {
  useEffect(() => {
    addReceivedKey(shareKey, { destination, nights });
  }, [shareKey, destination, nights]);

  return null;
}
