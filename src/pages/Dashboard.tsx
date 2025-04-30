import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Link } from "react-router-dom";

const Dashboard = () => {
  return (
    <div className="p-6 bg-dark-900 min-h-screen">
      <h2 className="text-3xl text-white mb-8 text-center">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/add-driver">
          <Card className="p-6 bg-dark-800 rounded-lg shadow-md hover:shadow-xl transition-all">
            <h3 className="text-xl text-white mb-4">Add Driver</h3>
            <p className="text-gray-400 mb-4">
              Add a new driver to the system.
            </p>
            <Button className="bg-blue-600 text-white hover:bg-blue-700">
              Go
            </Button>
          </Card>
        </Link>

        <Link to="/parcels/add">
          <Card className="p-6 bg-dark-800 rounded-lg shadow-md hover:shadow-xl transition-all">
            <h3 className="text-xl text-white mb-4">Add Parcel</h3>
            <p className="text-gray-400 mb-4">Create a new parcel record.</p>
            <Button className="bg-blue-600 text-white hover:bg-blue-700">
              Go
            </Button>
          </Card>
        </Link>

        <Link to="/view-parcels">
          <Card className="p-6 bg-dark-800 rounded-lg shadow-md hover:shadow-xl transition-all">
            <h3 className="text-xl text-white mb-4">View Parcels</h3>
            <p className="text-gray-400 mb-4">Manage your parcel records.</p>
            <Button className="bg-blue-600 text-white hover:bg-blue-700">
              Go
            </Button>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
