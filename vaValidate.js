/*!
 * vaVallidate v1.0
 * Custom for marketing websites
 *
 */
(function ( $ ) {
    $.fn.vaValidate = function ( options ) {
        // This is the easiest way to have default options.
        var $self = $(this),
            errors = [],
            currentError = '',
            inProgress = false,
            textMinDefault = 1,
            textMaxDefault = 500,
            $alert,
            $submit = $self.find('[type="submit"]'),
            settings = $.extend({
                // These are the defaults.
                fields: $self.find('input, select, textarea'),
                alertType: 'global', //global || single
                email: /^([a-zA-Z0-9_.\-/+])+@([a-zA-Z0-9_.-])+\.([a-zA-Z])+([a-zA-Z])+/,
                tel: /^[0]{1}[\d -\(\)+]{9,20}$/,
                script: /[\<\>]+/,
                postcode: /^(.){5,10}$/,
                pStrength: /^(?=.*[\d])(?=.*[a-zA-Z])[^<>#]{8,}$/,
                tel: /(.{10})/,
                file: /^.*\.(jpg|jpeg|png|gif|pdf)$/i,
                captcha: 'none',
                genericMsg: 'Please correct the highlighted fields',
                captchaMsg: 'Please tell us that you are not a robot',
                errorClass: 'va-error',
                successClass: 'va-success',
                alertErrors: '#va-alert',
                gCaptcha: false,
                ajax: true,
                type: 'POST',
                dataType: 'json',
                uploadFile: false,
                action: '',
                jqxhr: function (data) {
                    //new FormData more reliable than serialize()
                    var formData = new FormData(),
                        basic = {
                            method: settings.type,
                            dataType: settings.dataType,
                            url: settings.action,
                            beforeSend: settings.before         
                        };
                    
                    //ajax call different when uploading files
                    if (settings.uploadFile) {
                        basic['cache'] = false;
                        basic['contentType'] = false;
                        basic['processData'] = false;
                        for (key in data) {
                            formData.append(key, data[key]);
                        }
                        basic.data = formData;                      
                    } else {
                        basic.data = data;  
                    }

                    return $.ajax(basic);
                },
                before: function (xhr) {
                    return console.log('before:', xhr);                         
                }, 
                success: function (data) {
                    return console.log('success:', data);                       
                },
                error: function (error) {
                    return console.log('error:', error.responseText);                       
                },
                always: function () {
                    return resetForm();                       
                },
                then: ''
            }, options ),
            alertBox = function () {
                var $alertBox = $(settings.alertErrors).find('ul.va-alertbox');
                //Make sure you don't prepend more than one alert container
                if ($alertBox.length === 0) {
                    $(settings.alertErrors).prepend('<ul class="va-alertbox hidden"></ul>');                
                }
            },
            findAlert = function () {
                //Assign it globally
                $alert = $self.find('ul.va-alertbox');
            },
            resetForm = function () {
                var $input;

                errors = [];
                $alert.addClass('hidden').html('');

                settings.fields.each(function () {
                    $input = $(this);
                    $input.parent('div, label').removeClass(settings.errorClass);
                    $input.parent('div, label').removeClass(settings.successClass);
                });
            },
            removeRepeat = function () {
                result = [];

                errors.map(function (value) {
                    if ($.inArray(value, result) === -1) {
                        result.unshift(value);
                    }
                });  

                return result;                
            },
            showErrors = function () {
                var errorMsg = '',
                    uniques;
                    
                errors.push(settings.genericMsg);
                uniques = removeRepeat();
                uniques.map(function (value) {
                    errorMsg += '<li>' + value + '</li>';
                });     
                
                if (uniques.length > 0) {
                    $alert.removeClass('hidden');
                } else {
                    $alert.addClass('hidden');
                }

                $alert.append(errorMsg);
                
                //scroll to top of the form
                scrollToTop();
            },
            scrollToTop = function () {
                //scroll to top of the form
                $(document.body).animate({
                    scrollTop: $self.offset().top
                }, 'slow');
            },
            validateField = function (entries) {
                var result = settings.errorClass;

                currentError = '';

                if (testRegex('script', entries.value)) {
                    return result;
                }

                switch (entries.type) {
                    case 'custom':
                        var custom = new RegExp(entries.pattern);
                        if (custom.test(entries.value)) {
                            result = settings.successClass;
                        } 
                    break;
                    case 'text':
                        if (entries.value.length >= entries.min) {
                            result = settings.successClass;                           
                        } 
                    break;
                    case 'postcode':
                        if (testRegex(entries.type, entries.value) && entries.value.length >= entries.min) {
                            result = settings.successClass;
                        }
                    break;
                    case 'password':
                        if (testRegex('pStrength', entries.value) && entries.value.length >= entries.min) {
                            result = settings.successClass;
                        } /*else {
                            if (entries.messages.required.length > 0) {
                                errors.push(entries.messages.required);
                            }
                        }*/
                    break;
                    case 'email':
                        if (testRegex(entries.type, entries.value)) {
                            result = settings.successClass;
                        }                       
                    break;
                    case 'checkbox':
                        if (entries.value) {
                            result = settings.successClass;
                        }
                    break;
                    case 'select':
                        if (entries.value.length > 0) {
                            result = settings.successClass;
                        }
                    break;
                    case 'textarea':
                        if (entries.value.length >= entries.min && entries.value.length <= entries.max) {
                            result = settings.successClass;
                        }
                    break;
                    case 'file':
                        if (entries.value && testRegex(entries.type, entries.value.name)) {
                            result = settings.successClass;
                        }
                    break;
                    case 'tel':
                        if (testRegex(entries.type, entries.value)) {
                            result = settings.successClass;
                        }
                    break;
                }

                if (result !== settings.errorClass && entries.mirrorTo && entries.mirrorTo !== entries.value) {
                    result = settings.errorClass;
                    errors.push(entries.messages.mirror);
                }
                
                if (result === settings.errorClass && settings.alertType === 'global' && entries.messages.required.length > 0) {
                    errors.push(entries.messages.pattern);
                } else if (result === settings.errorClass && settings.alertType === 'single') {
                    currentError = entries.messages.title;
                }

                return result;
            },
            getData = function ($el, validate, value1, value2) {
                var valid = $el.data(validate);

                return (valid) ? value1 : value2;
            },
            cleanValue = function (value, type) {
                var result;
            
                if (typeof value == 'string' && type !== 'password') {
                    result = value.trim();
                }

                return result;
            },
            testRegex = function (type, value) {
                return settings[type].test(value);
            },
            defineEntries =  function ($element) {
                var type = ($element.attr('type')) ? $element.attr('type') : ($element.data('va-textarea')) ? 'textarea' : 'select',
                    inputName = $element.attr('name'),
                    inputType = getData($element, 'va-custom', 'custom', type),
                    inputPlh = function () {
                        if (type === 'select') {
                            return getData($element, 'va-select-placeholder', $element.find('option').first().val(), '');
                        } else {
                            return $element.attr('placeholder');
                        }
                    },
                    getValue = function () {
                        switch (type) {
                            case 'select':
                                return cleanValue($element.find('option:selected').val(), inputPlh());
                            break;
                            case 'password':
                                return $element.val();
                            break;
                            case 'checkbox':
                                return $element.prop('checked');
                            break;
                            case 'file':
                                return $element[0].files[0];
                            break;
                            default:
                                 return cleanValue($element.val(), inputPlh());
                            break;
                        }
                    },
                    getMirrorValue = function () {
                        var mirror = $element.data('va-mirror-to'),
                            $mirrorEl = getData($element, 'va-mirror-to', $self.find('[name=' + mirror + ']'), false);

                        if ($mirrorEl) {
                            return cleanValue($mirrorEl.val(), $mirrorEl.attr('placeholder'));
                        }

                        return false;
                    };

                return {
                    name: inputName,
                    type: inputType,
                    code: $element.data('va-code'),
                    messages: {
                        title: $element.attr('title'),
                        required: getData($element, 'va-msg-required', $element.data('va-msg-required'), ''),
                        optional: getData($element, 'va-msg-optional', $element.data('va-msg-optional'), ''),
                        pattern: getData($element, 'va-msg-pattern', $element.data('va-msg-pattern'), ''),
                        mirror: getData($element, 'va-msg-mirror', $element.data('va-msg-mirror'), ''),
                    },
                    value: getValue(),
                    mirrorTo: getMirrorValue(),
                    pattern: getData($element, 'va-custom-pattern', $element.data('va-custom-pattern'), ''),
                    min: getData($element, 'va-min', $element.data('va-min'), textMinDefault),
                    max: getData($element, 'va-max', $element.data('va-max'), textMaxDefault),
                };
            },
            validate = function () {
                var invalid = false,
                    data = {},
                    codes = {},
                    dob = {},
                    promise,
                    captcha,
                    codeCount = 0,
                    $captchaWrapper,
                    validating = function () {
                        var $input = $(this),
                            entries = defineEntries($input),
                            $error;

                        if ($input.data('va-required')) {
                            validation = validateField(entries);
                            
                            $input.parent('div, label').addClass(validation);
                                                    
                            //Any input will trigger showing errors
                            if (validation === settings.errorClass) {
                                invalid = true;                                 
                            }
                        } else if ($input.data('va-optional') && entries.value.length > 0) {
                            validation = validateField(entries);
                            
                            $input.parent('div, label').addClass(validation);
                            
                            //Any input will trigger showing errors
                            if (validation === settings.errorClass) {
                                invalid = true;                                 
                            } else {
                                 currentError = '';
                            }
                        } else {
                            currentError = '';
                        }

                        $error = $input.siblings('span.error');
                        
                        //clear errors
                        if ($error.length > 0) {
                            $error.text(currentError);
                        }

                        if (invalid && settings.alertType === 'single') {  
                            $error = $input.siblings('span.error');
                            if ($error.length > 0 && entries.type === 'checkbox') {
                                if ($error.length > 0) {
                                    $error.text(currentError);
                                } else {
                                    $input.before('<span class="error">' + currentError + '</span>');
                                }
                            } else if ($error.length > 0 && $input.data('va-code')) {
                                if (codeCount === 0 && $error.length > 0) {

                                } else if (codeCount === 0) {
                                    $input.siblings('span.error');
                                    $input.parent().append('<span class="error">' + currentError + '</span>');
                                }
                                codeCount++;
                            } else {
                                if ($error.length > 0) {
                                    $error.text(currentError);
                                } else {
                                    $input.before('<span class="error">' + currentError + '</span>');
                                }
                               
                            }
                            
                        }

                        //Put the codes and dob together and add them to data outside this function
                        if ($input.data('va-code')) {
                            codes[$input.data('va-code')] = (codes[$input.data('va-code')]) ? codes[$input.data('va-code')] + entries.value : entries.value;
                        } else if ($input.data('va-dob')) {
                            dob[$input.data('va-dob')] = entries.value;
                        } else {
                            data[entries.name] = entries.value;
                        }

                        if (settings.alertType === 'single' && settings.errorClass.length > 0) {
                        }
                       
                    };

                settings.fields.each(validating);
                
                 if (settings.gCaptcha) {
                    $captchaWrapper = $('[data-sitekey]');
                    captcha = $self.find('[name="g-recaptcha-response"]').val();
                     if (captcha.length > 0) {
                        data['captcha'] = captcha;
                     } else {
                        $captchaError = $self.find('.captcha-error');

                        if ($captchaError.length > 0) {
                            $captchaError.text($captchaWrapper.data('va-message'));
                        } else {
                            $captchaWrapper.before('<span class="captcha-error">' + $captchaWrapper.data('va-message') + '</span>');
                        }

                        errors.push(settings.captchaMsg);
                        invalid = true;
                     }
                 } 


                for (value in codes) {
                    data[value] = codes[value];
                }

                if (dob.hasOwnProperty('day') && dob.hasOwnProperty('month') && dob.hasOwnProperty('year')) {
                   data['dob'] = dob['day'] + ' ' + dob['month'] + ' ' + dob['year'];
                   data.dob = data.dob.trim();
                }           

                if (invalid && settings.alertType === 'global') {
                    showErrors();
                } else if (invalid && settings.alertType === 'single') {
                    //do nothing - errors are already displayed
                } else {
                    if (settings.ajax) {
                        
                        promise = settings.jqxhr(data);
                        
                        /*Process a succesful action*/
                        promise.done(settings.success);

                        /*Process error in the call*/
                        promise.fail(settings.error);

                        if (typeof settings.then === 'function') {
                            promise.then(settings.then);
                        }
                        /*
                        Run all the time
                        promise.always(settings.always);
                        */
                    } else {
                        settings.success(data);
                    }

                    if (typeof settings.then === 'function') {
                        settings.then(data);
                    }

                    
                }
            },
            submissionHandle = function (e) {
                e.preventDefault();
                if (inProgress) {
                    return;
                }
                inProgress = true;
                resetForm();
                validate();
                inProgress = false;
            };
            alertBox();
            findAlert();
            $submit.off('click').on('click', submissionHandle);
    };
} ( jQuery ));
