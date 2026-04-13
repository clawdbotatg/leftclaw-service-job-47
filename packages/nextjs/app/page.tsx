"use client";

import { useState } from "react";
import { Address } from "@scaffold-ui/components";
import type { NextPage } from "next";
import { useAccount, useSwitchChain } from "wagmi";
import { useTargetNetwork } from "~~/hooks/scaffold-eth";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth/useScaffoldEventHistory";
import { useScaffoldReadContract } from "~~/hooks/scaffold-eth/useScaffoldReadContract";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth/useScaffoldWriteContract";
import { getParsedError, notification } from "~~/utils/scaffold-eth";

const CONTRACT_ADDRESS = "0x8EfF6404B69aa8784404c98C55a778Df31a1E7A3";

const Home: NextPage = () => {
  const { isConnected, chain } = useAccount();
  const { targetNetwork } = useTargetNetwork();
  const { switchChain } = useSwitchChain();
  const [newGreeting, setNewGreeting] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCooldown, setSubmitCooldown] = useState(false);

  const isOnWrongNetwork = isConnected && chain?.id !== targetNetwork.id;

  // Read current greeting
  const { data: currentGreeting, refetch: refetchGreeting } = useScaffoldReadContract({
    contractName: "HelloWorld",
    functionName: "greeting",
  });

  // Write contract hook
  const { writeContractAsync, isPending } = useScaffoldWriteContract({
    contractName: "HelloWorld",
  });

  // Read greeting history events
  const { data: greetingEvents, isLoading: isLoadingEvents } = useScaffoldEventHistory({
    contractName: "HelloWorld",
    eventName: "GreetingChanged",
    fromBlock: 44665006n,
    watch: true,
    blockData: true,
  });

  // Handle set greeting
  const handleSetGreeting = async () => {
    if (!newGreeting.trim()) {
      notification.warning("Please enter a greeting.");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = notification.loading("Submitting transaction...");

    try {
      await writeContractAsync({
        functionName: "setGreeting",
        args: [newGreeting],
      });

      notification.remove(loadingToast);
      notification.success("Greeting updated successfully!");
      setNewGreeting("");
      setSubmitCooldown(true);

      // Refetch after a brief delay to let the chain confirm
      setTimeout(() => {
        refetchGreeting();
      }, 2000);

      // Cooldown period to prevent spam
      setTimeout(() => {
        setSubmitCooldown(false);
      }, 4000);
    } catch (e: any) {
      notification.remove(loadingToast);
      const parsedError = getParsedError(e);
      notification.error(parsedError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isButtonDisabled = isSubmitting || isPending || submitCooldown || !newGreeting.trim() || !isConnected;

  return (
    <div className="flex items-center flex-col grow pt-10 px-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <h1 className="text-center text-4xl font-bold mb-2">Hello World</h1>
        <p className="text-center text-base-content/70 mb-8">A simple on-chain greeting on Base</p>

        {/* Contract address */}
        <div className="flex justify-center items-center gap-2 mb-8">
          <span className="text-sm text-base-content/60">Contract:</span>
          <Address address={CONTRACT_ADDRESS} />
        </div>

        {/* Current greeting card */}
        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body items-center text-center">
            <h2 className="card-title text-lg text-base-content/60">Current Greeting</h2>
            <p className="text-2xl font-semibold break-words w-full">
              {currentGreeting !== undefined ? (
                `"${currentGreeting}"`
              ) : (
                <span className="loading loading-dots loading-md"></span>
              )}
            </p>
          </div>
        </div>

        {/* Set greeting form */}
        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title text-lg text-base-content/60">Set New Greeting</h2>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="Enter your greeting..."
                className="input input-bordered flex-1"
                value={newGreeting}
                onChange={e => setNewGreeting(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && !isButtonDisabled) {
                    handleSetGreeting();
                  }
                }}
                disabled={!isConnected}
              />
              {isOnWrongNetwork ? (
                <button className="btn btn-warning" onClick={() => switchChain?.({ chainId: targetNetwork.id })}>
                  Switch to {targetNetwork.name}
                </button>
              ) : (
                <button className="btn btn-primary" onClick={handleSetGreeting} disabled={isButtonDisabled}>
                  {isSubmitting || isPending ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Setting...
                    </>
                  ) : submitCooldown ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      Confirming...
                    </>
                  ) : (
                    "Set Greeting"
                  )}
                </button>
              )}
            </div>
            {!isConnected && (
              <p className="text-sm text-base-content/50 mt-2">Connect your wallet to set a greeting.</p>
            )}
          </div>
        </div>

        {/* Greeting history */}
        <div className="card bg-base-100 shadow-xl mb-8">
          <div className="card-body">
            <h2 className="card-title text-lg text-base-content/60">Greeting History</h2>
            {isLoadingEvents ? (
              <div className="flex justify-center py-4">
                <span className="loading loading-spinner loading-md"></span>
              </div>
            ) : greetingEvents && greetingEvents.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Sender</th>
                      <th>Greeting</th>
                      <th>Block</th>
                    </tr>
                  </thead>
                  <tbody>
                    {greetingEvents.slice(0, 20).map((event, index) => (
                      <tr key={`${event.transactionHash}-${event.logIndex}-${index}`}>
                        <td>
                          <Address address={event.args?.sender} />
                        </td>
                        <td className="break-words max-w-[200px]">{event.args?.newGreeting}</td>
                        <td className="text-base-content/60">{event.blockNumber?.toString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-center text-base-content/50 py-4">No greeting events found yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
