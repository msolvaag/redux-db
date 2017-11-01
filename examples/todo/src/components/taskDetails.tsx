import * as React from "react";
import { connect } from "react-redux";
import { RouteComponentProps } from "react-router-dom";

import { deleteTask, updateTask, deleteComment } from "../actions";
import { selectTask, TaskViewModel } from "../selectors";

import { CommentList } from "./commentList";
import { NewComment } from "./newComment";

export interface TaskProps extends RouteComponentProps<{ taskId: string }> {
    task: TaskViewModel;

    deleteTask: typeof deleteTask;
    updateTask: typeof updateTask;
    deleteComment: typeof deleteComment;
}

class TaskComponent extends React.Component<TaskProps> {
    render() {
        return <div>
            <h2>{this.props.task.title}</h2>
            <hr />
            <CommentList comments={this.props.task.comments} deleteComment={this.props.deleteComment} />
            <NewComment taskId={this.props.task.id} />
        </div >;
    }
}

export const TaskDetails = connect(
    (state: any, ownProps: TaskProps) => ({ task: selectTask(state, ownProps.match.params.taskId) }),
    ({ deleteTask, updateTask, deleteComment })
)(TaskComponent) as React.ComponentClass;