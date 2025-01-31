import {Button} from '@/components/ui/button'
import { HamburgerMenuIcon } from "@radix-ui/react-icons"
import { use } from "react"  
import  { UserButton } from "@clerk/nextjs"
import { NavigationContext } from '@/lib/NavigationProvider'

function Header() {
  const { setisMobileNavOpen } = use(NavigationContext)

  return (
    <header className="border-b border-teal-600/50 bg-white/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="flex items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost"
            size="icon"
            onClick={()=>setisMobileNavOpen(true)}
            className="md:hidden text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-md"
            >
              <HamburgerMenuIcon className="h-6 w-6" />
          </Button>
          <div className="font-semibold bg-gradient-to-r from-teal-500 to-blue-500 text-transparent px-4 py-2 rounded-md bg-clip-text">
            Chat with AI Agent
          </div>
        </div>
        <div className="flex items-center">
          <UserButton 
            appearance={{ 
              elements:{
                avatarBox: "h-8 w-8 ring-2 ring-gray-200/50 ring-offset-2 rounded-full transition-shadow hover:ring-gray-300/50"
              },
            } }
          />

        </div>
      </div>

    </header>
  )
}

export default Header