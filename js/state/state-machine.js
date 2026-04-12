export class StateMachine {
    constructor(states, initial) {
        this.states = states;
        this.current = null;
        this.transition(initial);
    }

    transition(name, data) {
        if (this.current && this.states[this.current] && this.states[this.current].onExit) {
            this.states[this.current].onExit(data);
        }
        this.current = name;
        if (this.states[name] && this.states[name].onEnter) {
            this.states[name].onEnter(data);
        }
    }

    is(name) {
        return this.current === name;
    }
}
