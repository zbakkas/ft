"use client";

import { Dispatch, ReactElement, SetStateAction, useState } from "react";
import { Transition } from "@headlessui/react";
import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAvatar } from "../context/AvatarContext";
import { getGatewayUrl } from "@/lib/gateway";

export default function LoginButton() : ReactElement<any, any> {
  const [open, setOpen] : [boolean, Dispatch<SetStateAction<boolean>>] = useState(false);
  const [isRegister, setIsRegister] : [Boolean, Dispatch<SetStateAction<boolean>>] = useState(false);
  const [message, setmessage] : [string, Dispatch<SetStateAction<string>>] = useState("");
  const [email, setEmail] : [string, Dispatch<SetStateAction<string>>] = useState("");
  const [username, setUsername] : [string, Dispatch<SetStateAction<string>>] = useState("");
  const [password, setPassword] : [string, Dispatch<SetStateAction<string>>] = useState("");
  const [confirmPassword, setConfirmPassword] : [string, Dispatch<SetStateAction<string>>] = useState("");
  const navigate = useRouter();
  const { setVersion } = useAvatar()!;
  
  const handleSubmit = async (e: React.FormEvent) : Promise<undefined> => {
    e.preventDefault();

    const payload = isRegister
      ? { email, username, password, confirmPassword }
      : { email, password };

    const endpoint = isRegister
      ? getGatewayUrl("/api/v1/auth/register")
      : getGatewayUrl("/api/v1/auth/login");

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    let data;
    if (isRegister || !res.ok) {
      data = await res.json();
    }
    
    if (!res.ok) {
      setmessage(data?.code || "An error occurred. Please try again.");
      return;
    }

    if (!isRegister) {
      navigate.push('/');
      setVersion(Date.now());
    } else {
      setmessage(data?.code || "An error occurred. Please try again.");
      setIsRegister(false);
    }
  };

  return (
    <>
      {/* Login Button */}
      <button
        onClick={() => {
          setIsRegister(false); // default to login mode
          setOpen(true);
        }}
      >
        <LogIn className="text-white w-9 h-9" />
      </button>

      {/* Backdrop */}
      <Transition
        show={open}
        enter="transition-opacity duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-200"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div
          className="z-50 fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          onClick={() => setOpen(false)}
        >
          {/* Modal container */}
          <Transition
            show={open}
            enter="transition-all duration-300 transform"
            enterFrom="scale-95 opacity-0"
            enterTo="scale-100 opacity-100"
            leave="transition-all duration-200 transform"
            leaveFrom="scale-100 opacity-100"
            leaveTo="scale-95 opacity-0"
          >
            <div
              className="bg-white rounded-lg shadow-lg p-6 w-80 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Animated form content */}
              <Transition
                key={isRegister ? "register" : "login"}
                appear
                show
                enter="transition-all duration-300 transform"
                enterFrom="opacity-0 translate-y-2"
                enterTo="opacity-100 translate-y-0"
                leave="transition-all duration-200 transform"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 -translate-y-2"
              >
                <div>
                  <h2 className="text-xl text-black font-bold mb-4">
                    {isRegister ? "Create Account" : "Login"}
                  </h2>
                  {message && (
                    <div className="w-full border-2 border-gray-500 rounded-lg px-3 py-2 bg-gray-300 text-black my-4">
                      {message}
                    </div>
                  )}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                    />

                    {/* Username (register only) */}
                    {isRegister && (
                      <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    )}

                    {/* Password */}
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                    />

                    {/* Confirm password (register only) */}
                    {isRegister && (
                      <input
                        type="password"
                        placeholder="Confirm Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
                      />
                    )}

                    <button
                      type="submit"
                      className="w-full hover:bg-gray-800 text-white rounded-lg px-3 py-2 bg-black transition-colors"
                    >
                      {isRegister ? "Sign Up" : "Sign In"}
                    </button>
                  </form>

                  {/* Mode switch */}
                  <p className="text-sm text-center text-gray-600 mt-4">
                    {isRegister ? (
                      <>
                        Already have an account?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setIsRegister(false);
                            setmessage("");
                          }}
                          className="text-blue-600 hover:underline"
                        >
                          Login
                        </button>
                      </>
                    ) : (
                      <>
                        Don't have an account?{" "}
                        <button
                          type="button"
                          onClick={() => {
                            setIsRegister(true);
                            setmessage("");
                          }}
                          className="text-blue-600 hover:underline"
                        >
                          Create Account
                        </button>
                      </>
                    )}
                  </p>
                </div>
              </Transition>
            </div>
          </Transition>
        </div>
      </Transition>
    </>
  );
}
