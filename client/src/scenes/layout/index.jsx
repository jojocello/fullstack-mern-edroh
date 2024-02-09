import React, { useState } from "react";
import { Box, useMediaQuery } from "@mui/material";
import { Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "components/Navbar";
import Sidebar from "components/Sidebar";
import { useGetUserQuery } from "state/api";

const Layout = () => {
    const isNonMobile = useMediaQuery("(min-width: 600px)");
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const userId = useSelector((state) => state.global.userId);
    const { data } = useGetUserQuery(userId);

    return (
        <Box display={isNonMobile ? "flex" : "block"} width="100%" height="100%">
            <Sidebar
                user={data || {}}   // {} si la data est undefined
                isNonMobile={isNonMobile}
                drawerWidth="250px"
                isSidebarOpen={isSidebarOpen}
                setIsSidebarOpen={setIsSidebarOpen}
            />
            <Box flexGrow={1}>  {/* prend le reste de la largeur par rapport au Sidebar */}
                <Navbar
                    user={data || {}}    // {} si la data est undefined
                    isSidebarOpen={isSidebarOpen}
                    setIsSidebarOpen={setIsSidebarOpen}
                />
                <Outlet />       {/* Permet d'avoir le template de layers pour tous les composants encapsulés par le routing */}
            </Box>
        </Box>
    );
};

export default Layout;
