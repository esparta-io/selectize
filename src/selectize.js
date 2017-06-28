angular.module('selectize', [])

    .directive('selectize', function ($timeout, $parse, $rootScope) {
        return {
            restrict: 'A',
            scope: {
                createFn: '&selectizeCreate',
                selectedFn: '&selectizeOnSelect',
                loadDataCallbackFn: '&selectizeLoadData',
                selectizeModel: '=selectizeModel',
                selectizeInitialData: '=selectizeInitialData',
                selectizeInitialDataLoad: '=selectizeInitialDataLoad',
                selectizeInitialDataLoadIndex: '=selectizeInitialDataLoadIndex',
                selectizeDisabled: '=selectizeDisabled',
                selectizeRender: '&selectizeRender',
                selectizeOnInitialize: '=selectizeOnInitialize',
                selectizeOnClick: '=selectizeOnClick',
                labelType: '@selectizeLabelType',
                error: '=?',
                show: '=?'
            },
            require: '?ngModel',
            link: function (scope, element, attrs, ngModel) {


                var pluginsAr = scope.$eval(attrs.selectizePlugins);

                var id = 0;

                scope.createNew = function (name, callback) {

                    scope.createFn({
                        name: name, callback: function (result) {
                            if (!result.id) {
                                result.id = --id;
                            }
                            if (scope.selectizeInitialData && scope.selectizeInitialData.indexOf(result) < 0) {
                                scope.selectizeInitialData.push(result);
                            }
                            callback(result);
                        }
                    })
                };

                scope.loadMore = function (query, callback) {
                    scope.loadDataCallbackFn({query: query, callback: callback});
                };

                scope.onChange = function (id) {

                    if (!scope.completed) {
                        return;
                    }
                    scope.error = id === '';

                    if (!opts.maxItems || !opts.maxItems > 1) {
                        var array = id.split(',');

                        var $values = [];

                        angular.forEach(array, function ($arrItem) {
                            angular.forEach(scope.selectizeInitialData, function ($item) {
                                if ($item && $item.id == $arrItem) {
                                    $values.push($item);
                                }
                            });
                        });

                        scope.selectedFn({id: array, model: $values});
                    } else {
                        var $value = undefined;

                        angular.forEach(scope.selectizeInitialData, function ($item) {
                            if ($item && $item.id == id) {
                                $value = $item;
                            }
                        });

                        scope.selectedFn({id: id, model: $value});
                    }

                    if (!$rootScope.$$phase) {
                        $rootScope.$apply();
                    }

                };

                scope.renderFn = function (item, escape) {
                    return scope.selectizeRender({item: item, escape: escape});
                };

                var generateLabelFunction = function (labelType) {
                    return function (data, escape) {
                        if (typeof labelType === 'undefined') {
                            labelType = 'add.new';
                        }
                        if (labelType != 'disable') {
                            return '<div class="create">' + 'Adicionar ' + ' <strong>' + escape(data.input) + '</strong>&hellip;</div>';
                        }
                    }
                };

                var options = {
                    valueField: 'id',
                    labelField: 'name',
                    beizerField: 'id',
                    plugins: pluginsAr,
                    searchField: 'name',
                    create: scope.createNew,
                    persist: true,
                    preload: false,
                    load: scope.loadMore,
                    onChange: scope.onChange,
                    render: {
                        option_create: generateLabelFunction(scope.labelType)
                    },
                    onInitialize: scope.onInit
                };

                var opts = angular.extend(options, scope.$eval(attrs.selectize));

                /** @namespace opts.renderize */
                if (opts.renderize && opts.renderize === true) {
                    opts = angular.extend(opts, {
                        render: {
                            option: scope.renderFn,
                            item: scope.renderFn,
                            option_create: generateLabelFunction(scope.labelType)
                        }
                    });
                }

                $timeout(function () {
                    scope.selectize = $(element).selectize(opts)[0].selectize;
                    updateSelectizeValues();
                });

                /** @namespace attrs.selectizeClearEvent */
                var clearEvent = attrs.selectizeClearEvent;
                if (angular.isDefined(clearEvent)) {
                    scope.$on(clearEvent, function () {
                        if (angular.isDefined(scope.selectize)) {
                            scope.selectize.clearOptions();
                            scope.selectize.clear();
                        }
                    });
                }

                /** @namespace attrs.selectizeRestart */
                var restartEvent = attrs.selectizeRestart;
                if (angular.isDefined(restartEvent)) {
                    scope.$on(restartEvent, function ($event, $args) {
                        if (angular.isDefined(scope.selectize)) {
                            if ($args) {
                                if (angular.isArray($args)) {
                                    scope.selectizeInitialDataLoadIndex = $args;
                                } else {
                                    scope.selectizeInitialDataLoadIndex = [$args];
                                }
                            }

                            scope.selectize.clear();
                            scope.selectize.clearOptions();
                            scope.selectize = undefined;
                            scope.selectize = $(element).selectize(opts)[0].selectize;
                            updateSelectizeValues();
                        }
                    });
                }

                /** @namespace attrs.selectizeClearEventSelected */
                var clearEventSelected = attrs.selectizeClearEventSelected;
                if (angular.isDefined(clearEventSelected)) {
                    scope.$on(clearEventSelected, function ($event, $args) {
                        if (angular.isDefined(scope.selectize)) {
                            scope.selectize.clear();
                            if ($args) {
                                $timeout(function () {
                                    scope.selectize.addItem($args);
                                }, 200);
                            }
                        }
                    });
                }

                var selectizeUpdateTitle = attrs.selectizeUpdateTitle;
                if (angular.isDefined(selectizeUpdateTitle)) {
                    scope.$on(selectizeUpdateTitle, function ($event, $data) {
                        if (angular.isDefined(scope.selectize)) {
                            scope.selectize.updateOption($data.id, $data);
                            scope.selectize.refreshItems();
                            scope.selectize.close();
                            scope.selectize.open();
                        }
                    });
                }

                var open = function () {
                    if (angular.isDefined(scope.selectize)) {
                        scope.selectize.open();
                    } else {
                        $timeout(function () {
                            open();
                        }, 100);
                    }
                };

                /** @namespace attrs.selectizeOpen */
                var openEvent = attrs.selectizeOpen;
                if (angular.isDefined(openEvent)) {
                    scope.$on(openEvent, function () {
                        open();
                    });
                }


                /** @namespace attrs.selectizeReloadEvent */
                var event = attrs.selectizeReloadEvent;
                if (angular.isDefined(event)) {
                    scope.$on(event, function () {
                        if (angular.isDefined(scope.selectize)) {
                            scope.selectize.clear();
                            scope.selectize.clearOptions();
                            scope.selectize.load(function (callback) {
                                scope.loadMore('', callback);
                            });
                        }
                    });
                }

                var eventDefault = attrs.selectizeReloadDefaultEvent;
                if (angular.isDefined(eventDefault)) {
                    scope.$on(eventDefault, function ($event, $args) {
                        if (angular.isDefined(scope.selectize)) {
                            if ($args) {
                                scope.selectizeInitialDataLoadIndex = $args;
                            }
                            scope.selectize.clear();
                            updateSelectizeValues();
                        }
                    });
                }

                /** @namespace attrs.selectizeUpdateEvent */
                var eventUpdate = attrs.selectizeUpdateEvent;

                if (angular.isDefined(eventUpdate)) {
                    scope.$on(eventUpdate, function () {
                        if (angular.isDefined(scope.selectize)) {
                            updateSelectizeValues();
                        }
                    });
                }

                /** @namespace attrs.selectizeUpdateEvent */
                var selectizeReloadInitial = attrs.selectizeReloadInitial;

                if (angular.isDefined(selectizeReloadInitial)) {
                    scope.$on(selectizeReloadInitial, function () {
                        if (angular.isDefined(scope.selectize)) {
                            scope.selectize.clear();
                            scope.selectize.clearOptions();
                            updateSelectizeValues();
                        }
                    });
                }

                /** @namespace attrs.safeWatch */
                var safeWatch = attrs.safeWatch;

                if (angular.isDefined(safeWatch)) {
                    scope.$watch('selectizeInitialDataLoadIndex', function () {
                        updateSelectizeValues();
                    });
                    scope.$watch('selectizeInitialData', function (value) {
                        if (scope.selectize) {
                            scope.selectize.clear();
                            scope.selectize.clearOptions();
                        }
                        scope.selectizeInitialData = value;
                        updateSelectizeValues();
                    });

                }

                var updateSelectizeValues = function () {
                    /** @namespace attrs.cleanEmpty */
                    if (angular.isDefined(attrs.cleanEmpty) && angular.isDefined(scope.selectize)) {
                        var selected = scope.selectize.items;
                        var opts = scope.selectize.options;
                        scope.selectize.clearOptions();
                        angular.forEach(opts, function ($value) {
                            if ($value.id.indexOf('? ') < 0) {
                                scope.selectize.addOption($value);
                            }
                        });
                        scope.selectize.addItem(selected);
                    }

                    if (angular.isDefined(scope.selectize) && angular.isDefined(scope.selectizeInitialData) && scope.selectizeInitialData.length > 0 && angular.isDefined(scope.selectizeInitialData[0])) {

                        angular.forEach(scope.selectizeInitialData, function ($item) {
                            if ($item) {
                                scope.selectize.addOption($item);
                            }

                        });
                        $selectizeInitialDataWatcher();
                        if (scope.selectizeInitialDataLoad) {
                            if (angular.isDefined(scope.selectizeInitialDataLoadIndex)) {
                                if (scope.selectizeInitialDataLoadIndex === -1 || angular.isArray(scope.selectizeInitialDataLoadIndex)) {
                                    scope.selectize.refreshItems();
                                    angular.forEach(scope.selectizeInitialDataLoadIndex, function ($item) {
                                        if (angular.isDefined($item)) {
                                            scope.selectize.addItem($item[scope.selectize.settings.beizerField]);
                                        }
                                    });
                                    scope.completed = true;
                                } else {
                                    if (scope.selectizeInitialData[scope.selectizeInitialDataLoadIndex] !== undefined) {
                                        scope.selectize.setValue(scope.selectizeInitialData[scope.selectizeInitialDataLoadIndex][scope.selectize.settings.beizerField]);
                                    }
                                }
                            } else {
                                scope.selectize.setValue(scope.selectizeInitialData[0][scope.selectize.settings.beizerField]);
                            }

                        } else {
                            scope.completed = true;
                        }
                    }

                };

                var toggleEnabled = function () {
                    if (angular.isDefined(scope.selectizeDisabled) && scope.selectizeDisabled === true) {
                        scope.selectize.disable();
                        scope.selectize.clearOptions();
                    } else {
                        scope.selectize.enable();
                        if (!scope.remote) {
                            return;
                        }
                        scope.selectize.load(function (callback) {
                            scope.loadMore('', callback);
                        });
                    }
                };

                var $selectizeInitialDataWatcher = scope.$watch('selectizeInitialData', function () {
                    updateSelectizeValues();
                });

                scope.$watch('selectizeDisabled', function () {
                    if (angular.isDefined(scope.selectize)) {
                        toggleEnabled();
                    }
                });

                // TODO usar a função de onLoadComplete do selectize
                var $selectizeWatcher = scope.$watch('selectize', function () {
                    if (angular.isDefined(scope.selectize)) {
                        scope.onInit();
                        $selectizeWatcher();
                    }
                });

                scope.onInit = function () {
                    if (angular.isDefined(scope.selectize)) {
                        if (typeof scope.selectizeOnInitialize === 'function') {
                            scope.selectizeOnInitialize(scope.selectize);
                        }
                    }

                    updateSelectizeValues();
                    toggleEnabled();

                };

                scope.fieldName = attrs.fieldName || 'name';


                var validateRequired = function () {
                    if (!scope.selectize) {
                        return;
                    }

                    scope.error = scope.selectize.items.length === 0;
                };

                scope.$watch('show', function () {
                    validateRequired();
                });

                if (angular.isUndefined(scope.show)) {
                    scope.show = true;
                }

            }
        };
    })
;
