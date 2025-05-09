import { FC } from 'react';
import Link from 'next/link';
import { Plus, Clock, HelpCircle, MessageSquare, User } from 'lucide-react';

const Sidebar: FC = () => {
  return (
    <div className="w-64 h-screen bg-suliko-default-color text-white p-4 fixed left-0 top-0">
      <div className="mb-8">
        <h1 className="text-xl font-bold">Suliko</h1>
      </div>
      
      <nav className="space-y-4">
        <Link 
          href="/new-project"
          className="flex items-center space-x-3 p-2 rounded hover:bg-gray-800 transition-colors"
        >
          <Plus className="text-xl" />
          <span>New Project</span>
        </Link>

        <Link 
          href="/history"
          className="flex items-center space-x-3 p-2 rounded hover:bg-gray-800 transition-colors"
        >
          <Clock className="text-xl" />
          <span>History</span>
        </Link>

        <Link 
          href="/help"
          className="flex items-center space-x-3 p-2 rounded hover:bg-gray-800 transition-colors"
        >
          <HelpCircle className="text-xl" />
          <span>Help</span>
        </Link>

        <Link 
          href="/feedback"
          className="flex items-center space-x-3 p-2 rounded hover:bg-gray-800 transition-colors"
        >
          <MessageSquare className="text-xl" />
          <span>Feedback</span>
        </Link>
      </nav>

      <div className="absolute bottom-4 w-full left-0 px-4">
        <Link 
          href="/profile"
          className="flex items-center space-x-3 p-2 rounded hover:bg-gray-800 transition-colors"
        >
          <User className="text-xl" />
          <span>Profile</span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar; 