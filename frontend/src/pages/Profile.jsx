function Profile() {
  const user = {
    name: "User-1",
    username: "user1",
    avatar: "/Avatar.png",
    history: [
      { id: 1, product: "Smartphone", date: "2023-05-01" },
      { id: 2, product: "Laptop", date: "2023-04-15" },
      { id: 3, product: "Headphones", date: "2023-03-30" },
    ],
  }

  return (
    <div className="rounded-2xl shadow-lg p-8 bg-[#111827] border border-gray-700 backdrop-blur-md">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
        {/* Profile Avatar & Info */}
        <div className="flex flex-col items-center bg-[#1E293B] p-6 rounded-xl shadow-md border border-gray-700">
          <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-indigo-500 shadow-lg">
            <img src={user.avatar} alt="User Avatar" className="w-full h-full object-cover" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-white">{user.name}</h2>
          <p className="text-gray-400">@{user.username}</p>
        </div>

        {/* Analysis History Section */}
        <div className="flex-1 w-full">
          <h3 className="text-lg font-semibold text-white mb-4">Analysis History</h3>
          <div className="rounded-xl bg-[#1E293B] shadow-md border border-gray-700 p-4">
            <ul className="divide-y divide-gray-700">
              {user.history.map((item) => (
                <li 
                  key={item.id} 
                  className="p-4 rounded-lg transition-all duration-200 bg-[#0F172A] hover:bg-[#374151] flex justify-between items-center shadow-md"
                >
                  <p className="font-medium text-gray-300">{item.product}</p>
                  <p className="text-sm text-gray-400">{item.date}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
