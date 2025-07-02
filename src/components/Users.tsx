import React from 'react';
import { User } from 'lucide-react';

const Users: React.FC = () => {
  const users = [
    'veispinoza@kl.gscl.com'
  ];

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <div key={user} className="group">
          <div className="w-full flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 flex items-center justify-center bg-white rounded shadow-sm">
                <User className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="font-medium">{user}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Users;
