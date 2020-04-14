interface IListener {
  (data: string): void;
}

function deepcopy<T extends object>(source: T): T {
  return JSON.parse(JSON.stringify(source))
}

abstract class StoreBase {
  protected _data: any;
  protected _listeners: Array<IListener>;
  readonly data: any;

  constructor(readonly otpType: string) {
    this._data = null;
    this._listeners = [];
    this.data = function (): any {
      deepcopy(this._data);
    };
  }

  protected _refresh(): void {
    this._listeners.forEach((listener: IListener) => {
      listener(this._data);
    })
  }

  register(listener: IListener): void {
    this._listeners.push(listener);
    if(this._data) {
      listener(this._data);
    }
  }

  abstract update(_data: any): void;

}

class OTPStore extends StoreBase {
  update(_data: any): void {
    this._data = _data;
    this._refresh();
  }
}