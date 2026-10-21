
import { usePreferences } from "../../context/AppPreferences";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "../../validations/authSchema";
import { Link, useNavigate } from "react-router-dom";
import { registerUser, verifyRegistration } from "../../services/authService";

function RegisterForm() {
  const { t } = usePreferences();
  const navigate = useNavigate();

  const [pending, setPending] = useState(null);
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const sendCode = async (data) => {
    setBusy(true);
    setMessage("");
    try {
      const response = await registerUser(data);
      setPending(data);
      setOtp("");
      setResendAt(Date.now() + 60000);
      setMessage(response.message);
    } catch (error) {
      setMessage(error.response?.data?.message || "Unable to send verification email.");
    } finally {
      setBusy(false);
    }
  };

  const onSubmit = (data) => sendCode({
    name: data.fullName, email: data.email.trim().toLowerCase(),
    mobile: data.mobile, password: data.password, gender: data.gender,
  });

  const verifyCode = async (event) => {
    event.preventDefault();
    setBusy(true);
    try {
      const response = await verifyRegistration({ email: pending.email, otp });
      alert(response.message);
      navigate("/login");
    } catch (error) {
      setMessage(error.response?.data?.message || "Verification failed. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white-100 p-5 sm:p-8 rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold text-center text-indigo-600">
        ChatSphere
      </h1>

      <p className="text-center text-gray-500 mt-2">
        {t("createAccount")}
      </p>

      {message && <p role="status" className="mt-4 text-sm text-center">{message}</p>}
      {pending ? (
        <form onSubmit={verifyCode} className="mt-8 space-y-4">
          <p>Enter the code sent to {pending.email}. Check your spam folder too.</p>
          <label htmlFor="email-otp" className="block font-medium">Email verification code</label>
          <input id="email-otp" type="text" inputMode="numeric" autoComplete="one-time-code"
            pattern="[0-9]{6}" maxLength={6} required value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
            className="w-full border rounded-lg p-3" placeholder="6-digit code" />
          <button disabled={busy} className="w-full bg-indigo-600 text-white py-3 rounded-lg disabled:opacity-50">
            {busy ? "Please wait..." : "Verify email and register"}
          </button>
          <button type="button" disabled={busy} onClick={() => {
            if (Date.now() < resendAt) { setMessage("Please wait 60 seconds between code requests."); return; }
            sendCode(pending);
          }} className="text-indigo-600">Resend code</button>
          <button type="button" disabled={busy} onClick={() => { setPending(null); setOtp(""); setMessage(""); }}
            className="block text-gray-600">Edit registration details</button>
        </form>
      ) : <form onSubmit={handleSubmit(onSubmit)} className="mt-8">
        <fieldset disabled={busy}>
        {/* Full Name */}
        <div className="mb-4">
          <label className="block mb-2 font-medium">
            {t("fullName")} :
          </label>

          <input
            type="text"
            className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500"
            {...register("fullName")}
            placeholder={t("enterName")}
          />

          <p className="text-red-500 text-sm mb-3">
            {errors.fullName?.message}
          </p>
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block mb-2 font-medium">
            {t("email")} :
          </label>

          <input
            type="email"
            className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder={t("enterEmail")}
            {...register("email")}
          />

          <p className="text-red-500 text-sm mb-3">
            {errors.email?.message}
          </p>
        </div>

        <div className="mb-4">
          <label htmlFor="mobile" className="block mb-2 font-medium">Mobile number (required)</label>
          <input id="mobile" type="tel" required autoComplete="tel" {...register("mobile")}
            placeholder="e.g. +919876543210" className="w-full border rounded-lg p-3" />
          <p className="text-sm text-gray-500">Include your country code. Verification code will be sent to your email.</p>
          <p className="text-red-500 text-sm">{errors.mobile?.message}</p>
        </div>

        {/* Password */}
        <div className="mb-4">
          <label className="block mb-2 font-medium">
            {t("password")} :
          </label>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full border rounded-lg p-3 pr-12 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder={t("createPassword")}
              {...register("password")}
            />

            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3l18 18" />
                  <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                  <path d="M9.88 4.24A9.77 9.77 0 0 1 12 4c5 0 9 4 10 8a10.2 10.2 0 0 1-2.17 4.04" />
                  <path d="M6.61 6.61A10.1 10.1 0 0 0 2 12c1 4 5 8 10 8a9.9 9.9 0 0 0 4.39-1.02" />
                </svg>
                
              )}
            </button>
          </div>

          <p className="text-red-500 text-sm mb-3">
            {errors.password?.message}
          </p>
        </div>

        {/* Confirm Password */}
        <div className="mb-6">
          <label className="block mb-2 font-medium">
            Confirm {t("password")} :
          </label>

          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              className="w-full border rounded-lg p-3 pr-12 outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder={t("confirmPasswordPlaceholder")}
              {...register("confirmPassword")}
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword((prev) => !prev)
              }
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-600"
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
            >
              {showConfirmPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3l18 18" />
                  <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                  <path d="M9.88 4.24A9.77 9.77 0 0 1 12 4c5 0 9 4 10 8a10.2 10.2 0 0 1-2.17 4.04" />
                  <path d="M6.61 6.61A10.1 10.1 0 0 0 2 12c1 4 5 8 10 8a9.9 9.9 0 0 0 4.39-1.02" />
                </svg>
                
                
              )}
            </button>
          </div>

          <p className="text-red-500 text-sm mb-5">
            {errors.confirmPassword?.message}
          </p>
        </div>

        {/* Gender */}
        <div className="mb-4">
          <label className="block mb-2 font-medium">
            Gender
          </label>

          <select
            {...register("gender")}
            className="w-full border p-3 rounded-lg"
          >
            <option value="">{t("selectGender")}</option>
            <option value="male">{t("male")}</option>
            <option value="female">{t("female")}</option>
          </select>

          <p className="text-red-500 text-sm">
            {errors.gender?.message}
          </p>
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition"
        >
          {busy ? "Sending code..." : "Send verification code"}
        </button>
        </fieldset>
      </form>}

      <p className="text-center mt-6">
        {t("haveAccount")}

        <Link
          to="/login"
          className="text-indigo-600 ml-2 font-semibold"
        >
          Login
        </Link>
      </p>
    </div>
  );
}

export default RegisterForm;

