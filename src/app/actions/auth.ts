"use server"

import { signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "@/lib/auth"
import { AuthError } from "next-auth"

export async function signInAction(email: string, password: string) {
  try {
    await nextAuthSignIn("credentials", {
      email,
      password,
      redirectTo: "/",
    })
  } catch (err) {
    if (err instanceof AuthError) {
      switch (err.type) {
        case "CredentialsSignin":
          return { error: "Invalid email or password." }
        default:
          return { error: "Something went wrong. Please try again." }
      }
    }
    throw err
  }
}

export async function facultyTestSignInAction(email: string) {
  try {
    await nextAuthSignIn("faculty-test", {
      email,
      redirectTo: "/profile",
    })
  } catch (err) {
    if (err instanceof AuthError) {
      switch (err.type) {
        case "CredentialsSignin":
          return { error: "Employee record not found. Please use your official University email." }
        default:
          return { error: "Something went wrong. Please try again." }
      }
    }
    throw err
  }
}

export async function googleSignInAction() {
  await nextAuthSignIn("google", { redirectTo: "/profile" })
}

export async function signOutAction() {
  await nextAuthSignOut({ redirectTo: "/sign-in" })
}
