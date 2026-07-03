import { useEffect, useRef, useState } from "react";

import { useSafePageViewTracker } from "@/lib/tracking/safe-page-view-tracker";
import { getTrackingOptions } from "@/lib/tracking/tracking-config";

import Nav, { TNavData } from "../nav";
import { AwayPoster } from "./away-poster";

export default function AdvancedExcelViewer({
  file,
  versionNumber,
  navData,
}: {
  file: string;
  versionNumber: number;
  navData: TNavData;
}) {
  const { linkId, documentId, viewId, isPreview, dataroomId, brand } = navData;
  const pageNumber = 1;

  // The Microsoft Office viewer occasionally hangs on "fetching your file" the
  // first time it loads an uncached file. We can't read the cross-origin iframe
  // to detect this, so after a delay we surface a non-blocking "reload" button
  // that forces a fresh iframe load (a guided F5) if the viewer is still stuck.
  const [reloadKey, setReloadKey] = useState(0);
  const [showReloadHint, setShowReloadHint] = useState(false);

  useEffect(() => {
    setShowReloadHint(false);
    const timer = setTimeout(() => setShowReloadHint(true), 12000);
    return () => clearTimeout(timer);
  }, [reloadKey]);

  const startTimeRef = useRef(Date.now());
  const visibilityRef = useRef<boolean>(true);

  const {
    trackPageViewSafely,
    resetTrackingState,
    startIntervalTracking,
    stopIntervalTracking,
    getActiveDuration,
    isInactive,
    updateActivity,
  } = useSafePageViewTracker({
    ...getTrackingOptions(),
    externalStartTimeRef: startTimeRef,
  });

  // Start interval tracking when component mounts
  useEffect(() => {
    const trackingData = {
      linkId,
      documentId,
      viewId,
      pageNumber,
      versionNumber,
      dataroomId,
      isPreview,
    };

    startIntervalTracking(trackingData);

    return () => {
      stopIntervalTracking();
    };
  }, [
    linkId,
    documentId,
    viewId,
    pageNumber,
    versionNumber,
    dataroomId,
    isPreview,
    startIntervalTracking,
    stopIntervalTracking,
  ]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        visibilityRef.current = true;
        resetTrackingState();
        const trackingData = {
          linkId,
          documentId,
          viewId,
          pageNumber,
          versionNumber,
          dataroomId,
          isPreview,
        };
        startIntervalTracking(trackingData);
      } else {
        visibilityRef.current = false;
        stopIntervalTracking();
        const duration = getActiveDuration();
        if (duration > 0) {
          trackPageViewSafely(
            {
              linkId,
              documentId,
              viewId,
              duration,
              pageNumber,
              versionNumber,
              dataroomId,
              isPreview,
            },
            true,
          );
        }
      }
    };

    const handleBeforeUnload = () => {
      stopIntervalTracking();
      const duration = getActiveDuration();
      if (duration > 0) {
        trackPageViewSafely(
          {
            linkId,
            documentId,
            viewId,
            duration,
            pageNumber,
            versionNumber,
            dataroomId,
            isPreview,
          },
          true,
        );
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [
    linkId,
    documentId,
    viewId,
    pageNumber,
    versionNumber,
    dataroomId,
    isPreview,
    trackPageViewSafely,
    resetTrackingState,
    startIntervalTracking,
    stopIntervalTracking,
    getActiveDuration,
  ]);

  return (
    <>
      <Nav type="sheet" navData={navData} />
      <div
        style={{ height: "calc(100dvh - 64px)" }}
        className="relative mx-2 flex h-screen flex-col sm:mx-6 lg:mx-8"
      >
        <iframe
          key={reloadKey}
          className="h-full w-full"
          src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(file)}&wdPrint=0&action=embedview&wdAllowInteractivity=False`}
        ></iframe>
        {showReloadHint && (
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="absolute right-3 top-3 z-50 rounded-md bg-black/70 px-3 py-1.5 text-xs font-medium text-white shadow-md backdrop-blur transition hover:bg-black/85"
          >
            Não carregou? Recarregar
          </button>
        )}
        <div
          className="absolute bottom-0 left-0 right-0 z-50 h-[26px] bg-gray-950"
          style={{
            background: brand?.accentColor || "rgb(3, 7, 18)",
          }}
        />
      </div>
      <AwayPoster
        isVisible={isInactive}
        inactivityThreshold={getTrackingOptions().inactivityThreshold}
        onDismiss={updateActivity}
      />
    </>
  );
}
