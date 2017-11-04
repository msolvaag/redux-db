import * as React from "react";
import { connect } from "react-redux";
import { setTaskFilter } from "../actions";
import { selectTaskStats } from "../selectors";

interface TaskMenuProps {
    setTaskFilter: typeof setTaskFilter;

    activeFilter: string;
    numClosed: number;
    numOpen: number;
}

class TaskMenuComponent extends React.Component<TaskMenuProps>{

    setTaskFilter(e: React.MouseEvent<Element>, filter: string) {
        e.preventDefault();
        this.props.setTaskFilter(filter);
    }

    render() {
        const itemClass = (status: string) => this.props.activeFilter === status ? "active" : "";

        return <ul className="nav nav-pills mb-4">
            <li className="nav-item">
                <a href="#" className={"nav-link " + itemClass("open")} onClick={e => this.setTaskFilter(e, "open")}>Open <small className="badge badge-secondary">{this.props.numOpen}</small></a>
            </li>
            <li className="nav-item">
                <a href="#" className={"nav-link " + itemClass("closed")} onClick={e => this.setTaskFilter(e, "closed")}>Closed <small className="badge badge-secondary">{this.props.numClosed}</small></a>
            </li>
        </ul>;
    }
}

export const TaskMenu = connect(
    (state: any) => {
        const stats = selectTaskStats(state);
        return { ...stats, activeFilter: state.ui.taskFilter };
    },
    ({ setTaskFilter })
)(TaskMenuComponent);