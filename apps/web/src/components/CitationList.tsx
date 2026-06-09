import { useState } from "react";
import { Citation } from "../lib/api";
import { useLang } from "../lib/i18n";

type Props = {
  citations: Citation[];
};

export default function CitationList({ citations }: Props) {
  const { t } = useLang();
  const [openId, setOpenId] = useState("");

  if (!citations.length) {
    return <div className="empty-state compact">{t("cite.none")}</div>;
  }

  return (
    <div className="citation-list">
      {citations.map((citation, index) => {
        const open = openId === citation.chunk_id;
        return (
          <button
            className="citation-item"
            key={citation.chunk_id}
            onClick={() => setOpenId(open ? "" : citation.chunk_id)}
            type="button"
          >
            <div className="citation-title">
              <span>[{index + 1}]</span>
              <strong>{citation.document_name}</strong>
            </div>
            <div className="citation-meta">
              {t("cite.pageScore", {
                page: citation.page ?? t("cite.pageNA"),
                score: citation.score.toFixed(2),
              })}
            </div>
            {open ? <p>{citation.text_preview}</p> : null}
          </button>
        );
      })}
    </div>
  );
}

