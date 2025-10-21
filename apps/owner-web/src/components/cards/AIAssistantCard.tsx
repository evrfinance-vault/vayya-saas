import React from "react";
import Card, { type CardSize } from "../Card";
import "./AIAssistantCard.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUp } from "@fortawesome/free-solid-svg-icons";

type Props = { width?: CardSize; height?: CardSize };

export default function AIAssistantCard({
  width = "1x",
  height = "2x",
}: Props) {
  const [prompt, setPrompt] = React.useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
  }

  return (
    <Card title="AI Assistant" align="center" width={width} height={height}>
      <div className="ai-wrap">
        <img
          src="/assets/ai-avatar.jpg"
          alt="Kayya Logo"
          className="ai-orb"
          aria-hidden="true"
        />

        <div className="coming-soon-banner">
          <span>Coming Soon</span>
        </div>

        <ul className="ai-suggest" role="list">
          <li>Prepare a report on my revenue</li>
          <li>Recommendation to increase revenue for next month</li>
        </ul>

        <form className="ai-input" onSubmit={onSubmit}>
          <input
            type="text"
            placeholder="Ask Something…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled="disabled"
          />
          <button type="submit" className="ai-send" aria-label="Send" aria-disabled="true">
            <FontAwesomeIcon icon={faArrowUp} />
          </button>
        </form>
      </div>
    </Card>
  );
}
