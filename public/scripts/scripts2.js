'use strict';

/**
 * @ngdoc overview
 * @name angularGanttDemoApp
 * @description
 * # angularGanttDemoApp
 *
 * Main module of the application.
 */
angular.module('angularGanttDemoApp', [
    'gantt', // angular-gantt.
    'gantt.sortable',
    'gantt.movable',
    'gantt.drawtask',
    'gantt.tooltips',
    'gantt.bounds',
    'gantt.progress',
    'gantt.table',
    'gantt.tree',
    'gantt.groups',
    'gantt.dependencies',
    'gantt.overlap',
    'gantt.resizeSensor',
    'ngAnimate',
    'mgcrea.ngStrap'
]).config(['$compileProvider', function($compileProvider) {
    $compileProvider.debugInfoEnabled(false); // Remove debug info (angularJS >= 1.3)
}]);

'use strict';

/**
 * @ngdoc function
 * @name angularGanttDemoApp.controller:MainCtrl
 * @description
 * # MainCtrl
 * Controller of the angularGanttDemoApp
 */
angular.module('angularGanttDemoApp')
    .controller('MainCtrl', ['$scope', '$timeout', '$log', 'ganttUtils', 'GanttObjectModel', 'Sample', 'ganttMouseOffset', 'ganttDebounce', 'moment', function($scope, $timeout, $log, utils, ObjectModel, Sample, mouseOffset, debounce, moment) {
        var objectModel;
        $scope.showCM = false;
        $scope.sTime = new Date(2016, 1, 1, 0, 0, 0);
        $scope.eTime = new Date(2016, 1, 1, 0, 0, 0);
        $scope.options = {
            mode: 'custom',
            scale: 'hour',
            sortMode: undefined,
            sideMode: 'TreeTable',
            daily: false,
            maxHeight: true,
            width: true,
            zoom: 1,
            columns: ['model.name'],
            treeTableColumns: [],
            columnsHeaders: {'model.name' : 'Name'},
            columnsClasses: {'model.name' : 'gantt-column-name'},
            toolTipDateFormat: 'HH:mm',
            treeHeaderContent: '<i class="fa fa-align-justify"></i> {{getHeader()}}',
            columnsHeaderContents: {
                'model.name': '<i class="fa fa-align-justify"></i> {{getHeader()}}'
            },
            headersFormats: {
              day: 'YYYY年MM月DD日',
              hour: 'HH:mm'
            },
            autoExpand: 'both',
            taskOutOfRange: 'truncate',
            fromDate: moment(new Date(2016, 1, 1, 8, 0, 0)),
            toDate: moment(new Date(2016, 1, 2, 0, 0, 0)),
            rowContent: '<i class="fa fa-align-justify"></i> {{row.model.name}}',
            taskContent : '<i class="fa fa-tasks"></i> {{task.model.name}}',
            allowSideResizing: true,
            labelsEnabled: true,
            currentDate: 'line',
            currentDateValue: new Date(2016, 1, 1, 11, 20, 0),
            draw: true,
            readOnly: false,
            groupDisplayMode: 'group',
            filterTask: '',
            filterRow: '',
            timeFrames: {
                'day': {
                    start: moment('0:00', 'HH:mm'),
                    end: moment('24:00', 'HH:mm'),
                    color: '#ACFFA3',
                    working: true,
                    default: true
                },
                'noon': {
                    start: moment('12:00', 'HH:mm'),
                    end: moment('13:30', 'HH:mm'),
                    working: false,
                    default: true
                },
                'closed': {
                    working: false,
                    default: true
                },
                'weekend': {
                    working: false
                },
                'holiday': {
                    working: false,
                    color: 'red',
                    classes: ['gantt-timeframe-holiday']
                }
            },
            dateFrames: {
                'weekend': {
                    evaluator: function(date) {
                        return date.isoWeekday() === 6 || date.isoWeekday() === 7;
                    },
                    targets: ['weekend']
                },
                '11-november': {
                    evaluator: function(date) {
                        return date.month() === 10 && date.date() === 11;
                    },
                    targets: ['holiday']
                }
            },
            timeFramesWorkingMode: 'hidden',
            timeFramesNonWorkingMode: 'hidden',
            columnMagnet: '1 minutes',
            timeFramesMagnet: true,
            dependencies: false,
            contextTaskRow: undefined,
            contextTask: undefined,
            mvRow: undefined,
            mvFrom: undefined,
            mvTo: undefined,
            canDraw: function(event) {
                var isLeftMouseButton = event.button === 0 || event.button === 1;
                //if (event.currentTarget.className.includes('disableDraw')) {
                if (event.currentTarget.className.indexOf('disableDraw') !== -1) {
                    return false;
                }
                return $scope.options.draw && !$scope.options.readOnly && isLeftMouseButton;
            },
            drawTaskFactory: function() {
                return {
                    id: utils.randomUuid(),  // Unique id of the task.
                    name: 'Drawn task', // Name shown on top of each task.
                    color: '#F1C232' // Color of the task in HEX format (Optional).
                };
            },
            api: function(api) {
                // API Object is used to control methods and events from angular-gantt.
                $scope.api = api;

                api.core.on.ready($scope, function() {
                    // Log various events to console
                    api.scroll.on.scroll($scope, logScrollEvent);
                    api.core.on.ready($scope, logReadyEvent);

                    api.data.on.remove($scope, addEventName('data.on.remove', logDataEvent));
                    api.data.on.load($scope, addEventName('data.on.load', logDataEvent));
                    api.data.on.clear($scope, addEventName('data.on.clear', logDataEvent));
                    api.data.on.change($scope, addEventName('data.on.change', logDataEvent));

                    //api.tasks.on.add($scope, addEventName('tasks.on.add', logTaskEvent));
                    api.tasks.on.add($scope, function (newData) {
                        addEventName('tasks.on.add', logTaskEvent);
                        if (newData.model.name !== newData.row.model.name) {
                            newData.model.name = newData.row.model.name;
                        }
                        console.log(newData);
                    });
                    //api.tasks.on.change($scope, addEventName('tasks.on.change', logTaskEvent));
                    api.tasks.on.change($scope, function (newData) {
                        addEventName('tasks.on.change', logTaskEvent);
                        if (newData.model.name !== newData.row.model.name) {
                            newData.model.name = newData.row.model.name;
                        }
                        console.log(newData);
                    });
                    api.tasks.on.rowChange($scope, addEventName('tasks.on.rowChange', logTaskEvent));
                    //api.tasks.on.remove($scope, addEventName('tasks.on.remove', logTaskEvent));
                    api.tasks.on.remove($scope, function (task) {
                        logTaskEvent('tasks.on.remove', task);
                        $scope.api.columns.refresh();
                        $scope.$applyAsync();
                    });

                    if (api.tasks.on.moveBegin) {
                        //api.tasks.on.moveBegin($scope, addEventName('tasks.on.moveBegin', logTaskEvent));
                        api.tasks.on.moveBegin($scope, function (task) {
                            logTaskEvent('tasks.on.moveBegin', task);
                            $scope.mvRow = task.row
                            $scope.mvFrom = task.model.from;
                            $scope.mvTo = task.model.to;
                        });
                        //api.tasks.on.move($scope, addEventName('tasks.on.move', logTaskEvent));
                        //api.tasks.on.moveEnd($scope, addEventName('tasks.on.moveEnd', logTaskEvent));
                        api.tasks.on.moveEnd($scope, function (task) {
                            var dupError = $scope.dupTaskFromTo(task);
                            logTaskEvent('tasks.on.moveEnd', task);
                            if (dupError == true && $scope.mvRow !== undefined) {
                                task.model.from = $scope.mvFrom;
                                task.model.to = $scope.mvTo;
                                if ($scope.mvRow.model.id !== task.row.model.id) {
                                    $scope.mvRow.moveTaskToRow(task);
                                }
                                else {
                                    task.updatePosAndSize();
                                }
                            }
                            $scope.mvRow = undefined;
                            $scope.mvFrom = undefined;
                            $scope.mvTo = undefined;
                        });

                        //api.tasks.on.resizeBegin($scope, addEventName('tasks.on.resizeBegin', logTaskEvent));
                        api.tasks.on.resizeBegin($scope, function (task) {
                            logTaskEvent('tasks.on.resizeBegin', task);
                            $scope.mvRow = task.row
                            $scope.mvFrom = task.model.from;
                            $scope.mvTo = task.model.to;
                        });
                        //api.tasks.on.resize($scope, addEventName('tasks.on.resize', logTaskEvent));
                        //api.tasks.on.resizeEnd($scope, addEventName('tasks.on.resizeEnd', logTaskEvent));
                        api.tasks.on.resizeEnd($scope, function (task) {
                            var dupError = $scope.dupTaskFromTo(task);
                            logTaskEvent('tasks.on.resizeEnd', task);
                            if (dupError == true) {
                                if ($scope.mvRow !== undefined) {
                                    task.model.from = $scope.mvFrom;
                                    task.model.to = $scope.mvTo;
                                    if ($scope.mvRow.model.id !== task.row.model.id) {
                                        $scope.mvRow.moveTaskToRow(task);
                                    }
                                    else {
                                        task.updatePosAndSize();
                                    }
                                } else {
                                    var tmpRow = task.row;
                                    tmpRow.removeTask(task.model.id);
                                }
                            }
                            $scope.mvRow = undefined;
                            $scope.mvFrom = undefined;
                            $scope.mvTo = undefined;
                        });
                    }

                    api.rows.on.add($scope, addEventName('rows.on.add', logRowEvent));
                    api.rows.on.change($scope, addEventName('rows.on.change', logRowEvent));
                    api.rows.on.move($scope, addEventName('rows.on.move', logRowEvent));
                    api.rows.on.remove($scope, addEventName('rows.on.remove', logRowEvent));

                    api.side.on.resizeBegin($scope, addEventName('labels.on.resizeBegin', logLabelsEvent));
                    //api.side.on.resize($scope, addEventName('labels.on.resize', logLabelsEvent));
                    api.side.on.resizeEnd($scope, addEventName('labels.on.resizeEnd', logLabelsEvent));

                    api.timespans.on.add($scope, addEventName('timespans.on.add', logTimespanEvent));
                    api.columns.on.generate($scope, logColumnsGenerateEvent);

                    api.rows.on.filter($scope, logRowsFilterEvent);
                    api.tasks.on.filter($scope, logTasksFilterEvent);

                    api.data.on.change($scope, function(newData) {
                        console.log(newData);
                    });

                    // When gantt is ready, load data.
                    // `data` attribute could have been used too.
                    $scope.load();

                    // Add some DOM events
                    api.directives.on.new($scope, function(directiveName, directiveScope, element) {
                        if (directiveName === 'ganttTask') {
                            element.bind('click', function(event) {
                                event.stopPropagation();
                                logTaskEvent('task-click', directiveScope.task);
                            });
                            element.bind('contextmenu', function(event) {
                                event.preventDefault();
                                logTaskEvent('task-contextmenu:(' + event.clientX + ',' + event.clientY + ')',
                                    directiveScope.task);
                                var elem = $("#contextmenu-node");
                                $scope.showCM = true;
                                elem.css("z-index", "9999");
                                elem.css("left", (event.clientX + $(window).scrollLeft() - 3) + "px");
                                elem.css("top", (event.clientY + $(window).scrollTop() - 3) + "px");
                                $scope.contextTaskRow = directiveScope.row;
                                $scope.contextTask = directiveScope.task;
                                $scope.sTime = directiveScope.task.model.from;
                                $scope.eTime = directiveScope.task.model.to;
                                $scope.mvRow = directiveScope.task.row
                                $scope.mvFrom = directiveScope.task.model.from;
                                $scope.mvTo = directiveScope.task.model.to;
                                $scope.$applyAsync();
                            });
                        }
                    });

                    api.tasks.on.rowChange($scope, function(task) {
                        //$scope.live.row = task.row.model;
                    });

                    objectModel = new ObjectModel(api);
                });
            }
        };

        $scope.handleTaskIconClick = function(taskModel) {
            alert('Icon from ' + taskModel.name + ' task has been clicked.');
        };

        $scope.handleRowIconClick = function(rowModel) {
            alert('Icon from ' + rowModel.name + ' row has been clicked.');
        };

        $scope.expandAll = function() {
            $scope.api.tree.expandAll();
        };

        $scope.collapseAll = function() {
            $scope.api.tree.collapseAll();
        };

        $scope.clickedCTXTDelete = function (e) {
            console.log('clickedCTXTDelete:');
            if ($scope.contextTaskRow !== undefined) {
                $scope.contextTaskRow.removeTask($scope.contextTask.model.id);
            }
            $scope.contextTaskRow = undefined;
            $scope.contextTask = undefined;
            $scope.showCM = false;
        }

        $scope.closeContextMenu = function (e) {
            var dupError = false;
            console.log('closeContextMenu:');
            if ($scope.contextTask !== undefined) {
                console.log($scope.contextTask);
                console.log($scope.sTime);
                if ($scope.sTime < $scope.eTime) {
                    $scope.contextTask.model.from = moment($scope.sTime);
                    $scope.contextTask.model.to = moment($scope.eTime);
                    dupError = $scope.dupTaskFromTo($scope.contextTask);
                    if (dupError == true && $scope.mvRow !== undefined) {
                        $scope.contextTask.model.from = $scope.mvFrom;
                        $scope.contextTask.model.to = $scope.mvTo;
                    }

                }
            }
            $scope.contextTaskRow = undefined;
            $scope.contextTask = undefined;
            $scope.showCM = false;
            $scope.mvRow = undefined;
            $scope.mvFrom = undefined;
            $scope.mvTo = undefined;
        }

        $scope.dupTaskFromTo = function (task) {
            return $scope.data.some(function (elm, idx, arr) {
                if (elm.tasks === undefined) {
                    return false;
                } else {
                    return elm.tasks.some( function (element, index, elmarray) {
                        if (task.model.id !== element.id && task.model.from < element.to && task.model.to > element.from) {
                            return true;
                        }
                    });
                }
            });
        };

        $scope.$watch('options.sideMode', function(newValue, oldValue) {
            if (newValue !== oldValue) {
                $scope.api.side.setWidth(undefined);
                $timeout(function() {
                    $scope.api.columns.refresh();
                });
            }
        });

        $scope.canAutoWidth = function(scale) {
            if (scale.match(/.*?hour.*?/) || scale.match(/.*?minute.*?/)) {
                return false;
            }
            return true;
        };

        $scope.getColumnWidth = function(widthEnabled, scale, zoom) {
            if (!widthEnabled && $scope.canAutoWidth(scale)) {
                return undefined;
            }

            if (scale.match(/.*?week.*?/)) {
                return 150 * zoom;
            }

            if (scale.match(/.*?month.*?/)) {
                return 300 * zoom;
            }

            if (scale.match(/.*?quarter.*?/)) {
                return 500 * zoom;
            }

            if (scale.match(/.*?year.*?/)) {
                return 800 * zoom;
            }

            return 60 * zoom;
        };

        // Reload data action
        $scope.load = function() {
            $scope.data = Sample.getSampleData();

            $scope.timespans = Sample.getSampleTimespans();
        };

        $scope.reload = function() {
            $scope.load();
        };

        // Remove data action
        $scope.remove = function() {
            $scope.api.dependencies.refresh();
        };

        // Clear data action
        $scope.clear = function() {
            $scope.data = [];
        };

        // Event handler
        var logScrollEvent = function(left, date, direction) {
            if (date !== undefined) {
                $log.info('[Event] api.on.scroll: ' + left + ', ' + (date === undefined ? 'undefined' : date.format()) + ', ' + direction);
            }
        };

        // Event handler
        var logDataEvent = function(eventName) {
            $log.info('[Event] ' + eventName);
        };

        // Event handler
        var logTaskEvent = function(eventName, task) {
            $log.info('[Event] ' + eventName + ': ' + task.model.name);
        };

        // Event handler
        var logRowEvent = function(eventName, row) {
            $log.info('[Event] ' + eventName + ': ' + row.model.name);
        };

        // Event handler
        var logTimespanEvent = function(eventName, timespan) {
            $log.info('[Event] ' + eventName + ': ' + timespan.model.name);
        };

        // Event handler
        var logLabelsEvent = function(eventName, width) {
            $log.info('[Event] ' + eventName + ': ' + width);
        };

        // Event handler
        var logColumnsGenerateEvent = function(columns, headers) {
            $log.info('[Event] ' + 'columns.on.generate' + ': ' + columns.length + ' column(s), ' + headers.length + ' header(s)');
        };

        // Event handler
        var logRowsFilterEvent = function(rows, filteredRows) {
            $log.info('[Event] rows.on.filter: ' + filteredRows.length + '/' + rows.length + ' rows displayed.');
        };

        // Event handler
        var logTasksFilterEvent = function(tasks, filteredTasks) {
            $log.info('[Event] tasks.on.filter: ' + filteredTasks.length + '/' + tasks.length + ' tasks displayed.');
        };

        // Event handler
        var logReadyEvent = function() {
            $log.info('[Event] core.on.ready');
        };

        // Event utility function
        var addEventName = function(eventName, func) {
            return function(data) {
                return func(eventName, data);
            };
        };

    }]);

'use strict';

/**
 * @ngdoc service
 * @name angularGanttDemoApp.Sample
 * @description
 * # Sample
 * Service in the angularGanttDemoApp.
 */
angular.module('angularGanttDemoApp')
    .service('Sample', function Sample() {
        return {
            getSampleData: function() {
                return [
                        // Order is optional. If not specified it will be assigned automatically
                        {id: 'R01G001', name: '製造所', classes: "disableDraw"},
                        {id: 'R01G001I001', name: '荷卸し', parent: 'R01G001', tasks:[
                            {
                                id: 'R01G001I001T001',
                                name: '荷卸し',
                                color: '#9FC5F8',
                                from: new Date(2016, 1, 1, 8, 0, 0),
                                to: new Date(2016, 1, 1, 9, 0, 0),
                                movable: false
                            },
                        ]},
                        {id: 'R01G001I002', name: '入荷検品', parent: 'R01G001', tasks:[
                            {
                                id: 'R01G001I002T001',
                                name: '入荷検品',
                                color: '#F1C232',
                                from: new Date(2016, 1, 1, 9, 0, 0),
                                to: new Date(2016, 1, 1, 10, 30, 0),
                            },
                        ]},
                        {id: 'R01G001I003', name: '荷役（入荷）', parent: 'R01G001', tasks:[]},
                        {id: 'R01G001I004', name: '出荷検品', parent: 'R01G001', tasks:[]},
                        {id: 'R01G001I005', name: '荷役（出荷）', parent: 'R01G001', tasks:[]},
                        {id: 'R02G002', name: '本倉庫', classes: "disableDraw"},
                        {id: 'R02G003', name: '梱', parent: 'R02G002', classes: "disableDraw"},
                        {id: 'R02G004', name: '入荷', parent: 'R02G003', classes: "disableDraw"},
                        {id: 'R02G004I001', name: '１Ｆ', parent: 'R02G004', tasks:[]},
                        {id: 'R02G004I002', name: '２Ｆ', parent: 'R02G004', tasks:[]},
                        {id: 'R02G004I003', name: '３Ｆ', parent: 'R02G004', tasks:[]},
                        {id: 'R02G004I004', name: '４Ｆ', parent: 'R02G004', tasks:[]},
                        {id: 'R02G005', name: '出荷', parent: 'R02G003', classes: "disableDraw"},
                        {id: 'R02G005I001', name: '１Ｆ', parent: 'R02G005', tasks:[]},
                        {id: 'R02G005I002', name: '２Ｆ', parent: 'R02G005', tasks:[]},
                        {id: 'R02G005I003', name: '３Ｆ', parent: 'R02G005', tasks:[]},
                        {id: 'R02G005I004', name: '４Ｆ', parent: 'R02G005', tasks:[]},

                        {id: 'R02G003I001', name: '検品・荷造り・積込', parent: 'R02G003', tasks:[]},
                        {id: 'R02G003I002', name: '外部倉庫', parent: 'R02G003', tasks:[]},

                        {id: 'R02G006', name: 'バラ', parent: 'R02G002', classes: "disableDraw"},
                        {id: 'R02G007', name: '商品', parent: 'R02G006', classes: "disableDraw"},
                        {id: 'R02G007I001', name: 'カート（積送）', parent: 'R02G007', tasks:[]},
                        {id: 'R02G007I002', name: 'カート（広域）', parent: 'R02G007', tasks:[]},
                        {id: 'R02G007I003', name: 'カート（コスミリオン）', parent: 'R02G007', tasks:[]},
                        {id: 'R02G007I004', name: '梱包/積付/他', parent: 'R02G007', tasks:[]},
                        {id: 'R02G007I005', name: '欠山', parent: 'R02G007', tasks:[]},
                        {id: 'R02G007I006', name: '欠山（コスミリオン）', parent: 'R02G007', tasks:[]},

                        {id: 'R02G008', name: '販促', parent: 'R02G006', classes: "disableDraw"},
                        {id: 'R02G008I001', name: '販促バラ（積送）', parent: 'R02G008', tasks:[]},
                        {id: 'R02G008I002', name: '販促バラ（経費）', parent: 'R02G008', tasks:[]},
                        {id: 'R02G008I003', name: '販促バラ（広域）', parent: 'R02G008', tasks:[]},
                        {id: 'R02G008I004', name: '積付/他', parent: 'R02G008', tasks:[]},

                        {id: 'R02G002I001', name: '輸出業務', parent: 'R02G002', tasks:[]},

                        {id: 'R02G009', name: '他', parent: 'R02G002', classes: "disableDraw"},
                        {id: 'R02G009I001', name: 'セット加工', parent: 'R02G009', tasks:[]},
                        {id: 'R02G009I002', name: '棚卸し', parent: 'R02G009', tasks:[]},
                        {id: 'R02G009I003', name: '３Ｓ', parent: 'R02G009', tasks:[]},
                        {id: 'R02G009I004', name: '事務', parent: 'R02G009', tasks:[]},
                        {id: 'R02G009I005', name: 'その他', parent: 'R02G009', tasks:[]},

                    ];
            },
            getSampleTimespans: function() {
                return [];/*
                        {
                            from: new Date(2016, 1, 1, 8, 0, 0),
                            to: new Date(2016, 1, 2, 19, 0, 0),
                            name: 'Sprint 1 Timespan'
                            //priority: undefined,
                            //classes: [],
                            //data: undefined
                        }
                    ];*/
            }
        };
    })
;
