import {observer} from "mobx-react";
import {Log, LogContext} from "./state/log.ts";
import {Route, Routes} from "react-router-dom";
import HomePage from "./pages/home.tsx";
import DropTarget from "./ui/DropTarget.tsx";
import {runInAction} from "mobx";
import EncounterIndex from "./pages/encounter";

// the main state object.
const log = new Log();

/**
 * Highest level 'App' component which renders the entire application.
 *
 * Contains the top-level router.
 */
const App = observer(() => {

    /**
     * Function which handles when a file is dropped onto the Home page.
     *
     * @param file the dropped file.
     */
    const handleDrop = (file: File) => {
        runInAction(() => log.parseFile(file));
    }

    return <LogContext value={log}>
        <Routes>
            <Route path={'encounter/*'} element={<EncounterIndex />} />
            <Route index element={<HomePage />}/>
        </Routes>

        <DropTarget onDrop={handleDrop}/>
    </LogContext>
});

export default App;
