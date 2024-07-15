import DesktopApps from "../Components/DesktopApps";
import React, { useState } from 'react';
import ContextMenu from "../Api/Libs/VioletClientManager/Core/Managers/Context/ContextMenu";


import TaskManager from "../Api/Libs/VioletClientManager/Components/TaskManager";

const Desktop = () => {

    return(
        <div className="Page Desktop"> 
            <DesktopApps />
            <TaskManager />
            <ContextMenu /> 
        </div>
    );
}
export default Desktop;