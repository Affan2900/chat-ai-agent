import Link from "next/link"
import { ArrowRight, Zap, Laptop, Brain } from "lucide-react"
import { SignedOut,SignedIn,SignInButton } from "@clerk/nextjs"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-blue-50 relative overflow-hidden">
      {/* Dynamic Grid Background */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#f0f7ff_1px,transparent_1px),linear-gradient(to_bottom,#f0f7ff_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"
        style={{
          animation: "background-move 60s linear infinite",
        }}
      />

      <div className="relative z-10">
        <main className="container mx-auto px-6 py-16 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-blue-900 mb-6 tracking-tight">AI Agent Assistant</h1>
          <p className="text-xl md:text-2xl text-blue-700 mb-4 max-w-2xl mx-auto">
            Meet your new AI chat companion that goes beyond conversation - it can actually get things done!
          </p>
          <p className="text-sm text-blue-600 mb-8">Powered by IBM&apos;s WxTools & your favourite LLM&apos;s.</p>

        <SignedIn>
          <Link href="/dashboard">
          <button className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 text-lg rounded-full">
  Get Started <ArrowRight className="ml-2 inline-block" size={20} />
</button>
          </Link>
        
        </SignedIn>

        <SignedOut>
          <SignInButton
            mode="modal"
            fallbackRedirectUrl={"/dashboard"}
            forceRedirectUrl={"/dashboard"}
          >
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-8 py-3 text-lg rounded-full">
  Sign Up <ArrowRight className="ml-2 inline-block" size={20} />
</button>

          </SignInButton>
        </SignedOut>

          <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-4xl mx-auto">
            <div className="p-6 rounded-xl bg-white/50 backdrop-blur-sm">
              <div className="w-12 h-12 bg-teal-500 text-white rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap size={24} />
              </div>
              <h2 className="text-xl font-semibold text-blue-900 mb-2">Fast</h2>
              <p className="text-blue-700">Real-time streamed responses</p>
            </div>

            <div className="p-6 rounded-xl bg-white/50 backdrop-blur-sm">
              <div className="w-12 h-12 bg-teal-500 text-white rounded-lg flex items-center justify-center mx-auto mb-4">
                <Laptop size={24} />
              </div>
              <h2 className="text-xl font-semibold text-blue-900 mb-2">Modern</h2>
              <p className="text-blue-700">Next.js 15, Tailwind CSS, Convex, Clerk</p>
            </div>

            <div className="p-6 rounded-xl bg-white/50 backdrop-blur-sm">
              <div className="w-12 h-12 bg-teal-500 text-white rounded-lg flex items-center justify-center mx-auto mb-4">
                <Brain size={24} />
              </div>
              <h2 className="text-xl font-semibold text-blue-900 mb-2">Smart</h2>
              <p className="text-blue-700">Powered by Your Favourite LLM&apos;s</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

