import { useState } from "react";
import type { PreviewImageProps } from "../interfaces.js";
import { cx } from "../utils.js";

export function PreviewImage(props: PreviewImageProps) {
  return <ImageSource key={props.src} {...props} />;
}

function ImageSource({ src, alt, fallbackLabel, fallback, className, fallbackClassName, loading = "lazy" }: PreviewImageProps) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) {
    return <div role="img" aria-label={fallbackLabel} className={cx("wm-preview-image", "wm-preview-image-fallback", fallbackClassName)}>
      {fallback}
    </div>;
  }
  return <img src={src} alt={alt} loading={loading} className={cx("wm-preview-image", className)}
    onError={() => setFailed(true)} />;
}
