// This layout overrides the root layout for login/register pages
// to hide the Navbar (no authentication needed here)
export default function AuthLayout({ children }) {
  return children;
}
