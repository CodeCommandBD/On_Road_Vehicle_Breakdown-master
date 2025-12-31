"use client";

import { useState } from "react";
import * as Sentry from "@sentry/nextjs";

export default function TestSentry() {
  const [message, setMessage] = useState("");

  const triggerError = () => {
    try {
      // Trigger a test error
      throw new Error("🚨 Test Sentry Error - This is a test!");
    } catch (error) {
      setMessage("Error triggered! Check Sentry dashboard.");
      throw error; // Re-throw to let Sentry catch it
    }
  };

  const triggerCustomError = () => {
    Sentry.captureException(new Error("Custom Error with Context"), {
      tags: {
        test: "manual-trigger",
        feature: "error-tracking",
      },
      extra: {
        timestamp: new Date().toISOString(),
        user_action: "clicked test button",
      },
    });
    setMessage("Custom error sent to Sentry!");
  };

  const sendMessage = () => {
    Sentry.captureMessage("Test message from Vehicle Breakdown App", {
      level: "info",
      tags: {
        test: "message",
      },
    });
    setMessage("Message sent to Sentry!");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-2xl p-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          🧪 Sentry Error Tracking Test
        </h1>
        <p className="text-gray-600 mb-8">
          Test your Sentry integration by triggering errors
        </p>

        {message && (
          <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded">
            <p className="font-bold">✅ Success</p>
            <p>{message}</p>
          </div>
        )}

        <div className="space-y-4">
          {/* Test 1: Automatic Error */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">
              Test 1: Automatic Error Capture
            </h2>
            <p className="text-gray-600 mb-4">
              Triggers an unhandled error that Sentry will automatically catch
            </p>
            <button
              onClick={triggerError}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-105"
            >
              🚨 Trigger Error
            </button>
          </div>

          {/* Test 2: Custom Error */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">
              Test 2: Custom Error with Context
            </h2>
            <p className="text-gray-600 mb-4">
              Manually sends an error with tags and extra data
            </p>
            <button
              onClick={triggerCustomError}
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-105"
            >
              📝 Send Custom Error
            </button>
          </div>

          {/* Test 3: Message */}
          <div className="border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-2">Test 3: Info Message</h2>
            <p className="text-gray-600 mb-4">
              Sends an informational message to Sentry
            </p>
            <button
              onClick={sendMessage}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-105"
            >
              💬 Send Message
            </button>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 p-6 rounded">
          <h3 className="font-bold text-blue-800 mb-2">📋 Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-blue-700">
            <li>Click any button above to test Sentry</li>
            <li>Go to your Sentry dashboard</li>
            <li>Check "Issues" section</li>
            <li>You should see the error/message within seconds!</li>
          </ol>
        </div>

        {/* Dashboard Link */}
        <div className="mt-6 text-center">
          <a
            href="https://sentry.io/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-8 rounded-lg transition duration-200"
          >
            🔗 Open Sentry Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}
