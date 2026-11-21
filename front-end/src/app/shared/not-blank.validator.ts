import {ValidatorFn} from '@angular/forms';

// comme Validators.required, mais refuse aussi les espaces seuls (aligné sur le @NotBlank du back)
export const notBlank: ValidatorFn = control => (control.value ?? '').trim() ? null : {required: true};
