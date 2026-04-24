import { SignIn } from "@clerk/nextjs"

export const AuthSignIn = () => {
  return (
    <div className="w-full h-screen flex items-center justify-center">
      <SignIn appearance={{
        
      }}/>
    </div>
  )
}