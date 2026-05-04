export class Controller {
  constructor(opts = {}) {
    this.opts = opts
  }

  call() { }

  destroy(opts = {}) { }

  static call(opts = {}) {
    const controller = new this(opts)

    controller.call();

    return controller;
  }
}