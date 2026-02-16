interface ErrorProps {
  code: number;
}

const errorMessages: Record<number, string> = {
  400: "Bad Request - The server could not understand the request",
  401: "Unauthorized - Authentication is required",
  403: "Forbidden - You don't have permission to access this resource",
  404: "Not Found - The requested resource could not be found",
  405: "Method Not Allowed - The request method is not supported",
  408: "Request Timeout - The server timed out waiting for the request",
  409: "Conflict - The request conflicts with the current state",
  429: "Too Many Requests - You have sent too many requests",
  500: "Internal Server Error - The server encountered an unexpected condition",
  502: "Bad Gateway - The server received an invalid response",
  503: "Service Unavailable - The server is temporarily unavailable",
  504: "Gateway Timeout - The server did not receive a timely response",
};

export default function Error({ code }: ErrorProps) {
  const message = errorMessages[code] || "An unexpected error occurred";

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-4">
        <h1 className="text-8xl font-bold text-gray-600">
          {code}
        </h1>
        <p className="text-xl text-gray-300 max-w-md">
          {message}
        </p>
      </div>
    </div>
  );
}
