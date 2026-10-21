export class HealthCheck {
  constructor(logPrefix = '', mesureSpeedEverySeconds = 10) {
    this.callCounter = 0;
    this.speed = 0;
    this.startTime = 0;

    this.logPrefix = logPrefix;
    this.mesureSpeedEverySeconds = mesureSpeedEverySeconds;

  }

  update() {
    const datetimeNow = Date.now();
    const timeDiff = (datetimeNow - this.startTime) / 1000;

    if (timeDiff >= this.mesureSpeedEverySeconds) {
      this.speed = (this.callCounter + 1) / timeDiff;

      this.callCounter = 0;
      this.startTime = datetimeNow;

      console.log(`${this.logPrefix}: ${this.speed} data/s`)

    } else {

      this.callCounter = this.callCounter + 1;
      this.speed = this.speed;
      this.startTime = this.startTime;

    }

  }
}