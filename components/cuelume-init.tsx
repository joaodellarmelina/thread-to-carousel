"use client";

import { useEffect } from "react";
import { bind } from "cuelume";

export function CuelumeInit() {
  useEffect(() => {
    bind();
  }, []);
  return null;
}
