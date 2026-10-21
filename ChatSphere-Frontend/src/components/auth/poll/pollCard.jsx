import { useEffect, useMemo, useState } from "react";
import {
  getPoll,
  votePoll,
  closePoll,
} from "../../../services/pollService";

function PollCard({
  poll: initialPoll,
  currentUserId,
}) {
  const normalizePoll = (value) => {
    if (!value) return null;
    const options = value.options || [];
    return {
      ...value,
      pollId: value.pollId || value._id,
      votes: value.votes || options.map((option) => ({
        optionId: option._id,
        count: option.votes || 0,
      })),
      totalVotes:
        value.totalVotes ??
        options.reduce((sum, option) => sum + (option.votes || 0), 0),
      userVote: value.userVote || null,
    };
  };

  const [poll, setPoll] = useState(normalizePoll(initialPoll));
  const [selectedOption, setSelectedOption] =
    useState(initialPoll?.userVote || "");
  const [loading, setLoading] = useState(false);
  const [closing, setClosing] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (
      !initialPoll ||
      typeof initialPoll !== "string"
    ) {
      return;
    }

    const loadPoll = async () => {
      try {
        const loadedPoll =
          await getPoll(initialPoll);

        if (loadedPoll) {
          setPoll(
            normalizePoll(loadedPoll)
          );

          setSelectedOption(
            loadedPoll.userVote || ""
          );
        }
      } catch (error) {
        console.error(
          "Failed to load poll:",
          error
        );

        setError(
          "Failed to load poll."
        );
      }
    };

    loadPoll();
  }, [initialPoll]);

  useEffect(() => {
    setPoll(normalizePoll(initialPoll));
    setSelectedOption(initialPoll?.userVote || "");
  }, [initialPoll]);

  useEffect(() => {
    if (!poll?.pollId) return;

    const timer = setInterval(async () => {
      try {
        const updated = await getPoll(poll.pollId);

        if (updated) {
          setPoll(normalizePoll(updated));

          if (updated.userVote) {
            setSelectedOption(updated.userVote);
          }
        }
      } catch (error) {
        console.error(
          "Poll refresh failed:",
          error
        );
      }
    }, 10000);

    return () => clearInterval(timer);
  }, [poll?.pollId]);

  const expired = useMemo(() => {
    if (!poll?.expiresAt) return false;

    return (
      new Date(poll.expiresAt).getTime() <=
      Date.now()
    );
  }, [poll?.expiresAt]);

  const isClosed = Boolean(
    poll?.isClosed || poll?.isExpired || expired
  );

  const hasVoted = Boolean(poll?.userVote);

  const creatorId = String(
    poll?.createdBy?._id ||
      poll?.createdBy ||
      ""
  );

  const isCreator =
    creatorId &&
    String(currentUserId) === creatorId;

  const getVoteCount = (optionId) => {
    const vote = poll?.votes?.find(
      (item) =>
        String(item.optionId) ===
        String(optionId)
    );

    return vote?.count || 0;
  };

  const handleVote = async () => {
    if (
      !selectedOption ||
      !poll?.pollId ||
      loading ||
      isClosed ||
      hasVoted
    ) {
      return;
    }
  
    setLoading(true);
    setError("");
  
    try {
      await votePoll(
        poll.pollId,
        selectedOption
      );
    
      // Fetch the latest poll so vote count
      // and percentages are updated immediately.
      const refreshed = await getPoll(
        poll.pollId
      );
    
      if (refreshed) {
        setPoll(normalizePoll(refreshed));
      
        setSelectedOption(
          refreshed.userVote || selectedOption
        );
      }
    } catch (error) {
      console.error(
        "Poll vote failed:",
        error
      );
    
      setError(
        error.response?.data?.message ||
          "Failed to submit vote."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    if (
      !poll?.pollId ||
      closing ||
      !isCreator ||
      poll.isClosed
    ) {
      return;
    }

    setClosing(true);
    setError("");

    try {
      const updated = await closePoll(
        poll.pollId
      );

      setPoll(normalizePoll(updated));
    } catch (error) {
      console.error("Poll close failed:", error);

      setError(
        error.response?.data?.message ||
          "Failed to close poll."
      );
    } finally {
      setClosing(false);
    }
  };

  if (!poll) return null;

  const totalVotes = poll.totalVotes || 0;

  return (
<div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm max-w-md text-gray-800">      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-gray-800">
            🗳️ Poll
          </h3>

          <p className="font-medium mt-2 text-gray-800">            {poll.question}
          </p>
        </div>

        {isClosed && (
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
            {poll.isExpired || expired
              ? "Expired"
              : "Closed"}
          </span>
        )}
      </div>

      <div className="mt-4 space-y-2">
        {poll.options?.map((option) => {
          const count = getVoteCount(option._id);

          const percentage =
            totalVotes > 0
              ? Math.round(
                  (count / totalVotes) * 100
                )
              : 0;

          const selected =
            String(
              selectedOption
            ) === String(option._id);

          return (
            <button
              key={option._id}
              type="button"
              disabled={
                isClosed ||
                loading ||
                hasVoted
              }
              onClick={() =>
                !hasVoted &&
                setSelectedOption(option._id)
              }
              className={`w-full text-left border rounded-xl p-3 ${
                selected
                  ? "border-indigo-500 bg-indigo-50 text-gray-800"
                  : "border-gray-200 hover:bg-gray-50"
              } disabled:cursor-not-allowed`}
            >
              <div className="flex justify-between gap-3">
                <span className="text-gray-800">
                  {option.text}
                </span>

                <span className="text-xs text-gray-500">
                  {count} ({percentage}%)
                </span>
              </div>

              {(hasVoted || isClosed) && (
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500"
                    style={{
                      width: `${percentage}%`,
                    }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {!hasVoted && !isClosed && (
        <button
          type="button"
          onClick={handleVote}
          disabled={!selectedOption || loading}
          className="w-full mt-4 bg-indigo-600 text-white py-2.5 rounded-xl disabled:opacity-50"
        >
          {loading ? "Voting..." : "Vote"}
        </button>
      )}

      {hasVoted && !isClosed && (
        <p className="text-xs text-green-600 mt-3">
          ✓ You have voted
        </p>
      )}

      <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
        <span>
          {totalVotes}{" "}
          {totalVotes === 1 ? "vote" : "votes"}
        </span>

        {poll.expiresAt && (
          <span>
            Expires{" "}
            {new Date(
              poll.expiresAt
            ).toLocaleString()}
          </span>
        )}
      </div>

      {isCreator && !poll.isClosed && !expired && (
        <button
          type="button"
          onClick={handleClose}
          disabled={closing}
          className="mt-3 text-sm text-red-600 hover:underline"
        >
          {closing
            ? "Closing..."
            : "Close poll"}
        </button>
      )}

      {error && (
        <p className="text-sm text-red-500 mt-3">
          {error}
        </p>
      )}
    </div>
  );
}

export default PollCard;