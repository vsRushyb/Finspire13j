$(".dialog").each(function(i, item){
	$(item).tab();
});

var setting = {
	async : {
		autoParam : ["projectId"],
		dataType:"json",
		enable:true,
		url : "domains-chart/find-by-project",
		dataFilter : function(treeId, parentNode, responseData){
			$.each(responseData, function(i, chart){
				chart.projectId = parentNode.id;
				chart.isParent = true;
				chart.type = "chart";
			});
			
			return responseData;
		}
	},
	callback : {
		beforeAsync : function(treeId, treeNode){
			if(treeNode && (treeNode.type == "project")){
				return true;
			} else {
				return false;
			}
		},
		onClick : function(event, treeId, treeData){
			if(treeData.type == "project"){
				$("#add_chart").show();
			} else {
				$("#add_chart").hide();
				if(treeData.type == "chart" && !mainTab.isExistTab(treeData.id)){
					mainTab.addTab({
						title : treeData.name,
						afterAdd : function(tab, panel){
							tab.addClass("tab_"+treeData.id);
							$.get('pages/template.html').done(function(data) {
								panel.html(data);
								panel.find('#canvas').umlCanvas();
								/*将projectId缓存在工具栏上，以待后续操作用到*/
								panel.find(".tools_bar:first").data("project",treeData);
							});
							
							
						},
						closeable : true
					});
				}
			}
			
		}
	}
};

/*常用的三个变量*/
var projectTree = $.fn.zTree.init($("#projectTree"), setting, []); //工程树
var mainTab = $(".main_panel").tab(); //右边tab
var dialog = $().dialog({});		  //页面对话框

$.ajax({
	url : "project/find-all-projects",
	data : "",
	type : "get",
	dataType : "json",
	success : function(data){
		$.each(data, function(i, d){
			d.isParent = true;
			d.projectId = d.id;
			d.type = "project";
		});
		projectTree.addNodes(null, data);
	},
	error : function(){
		alert("获取工程出错");
	}
});

/*创建工程对话框*/
$("#add_project").click(function(){
	dialog.
		show().
		setTitle("创建项目").
		setBody('<form class="dialog_form">\
					<label>工程名</label>&nbsp;&nbsp;<input type="text" oninput="var input=$(this);if(input.val()) {input.removeClass(\'not_null\')} else {input.addClass(\'not_null\')}"/>\
					<div class="dialog_buttons">\
						<button type="button" onclick="createProject($(this));">创建</button>\
						<button type="button" onclick="dialog.close();">取消</button>\
					</div>\
				</form>');
		
});

/*添加建图*/
$("#add_chart").click(function(){
	var project = projectTree.getSelectedNodes()[0];
	
	dialog.projectId = project.id;

	dialog.
		show().
		setTitle("添加UML图").
		setBody('<form class="dialog_form">\
					<label>UML图名</label>&nbsp;&nbsp;<input type="text" oninput="var input=$(this);if(input.val()) {input.removeClass(\'not_null\')} else {input.addClass(\'not_null\')}"/>\
					<div class="dialog_buttons">\
						<button type="button" onclick="addChart($(this));">确定</button>\
						<button type="button" onclick="dialog.close();">取消</button>\
					</div>\
				<form>');
});

/*
 * 生成代码。生成代码的按钮所在的工具栏已经缓存了当前的画布对象了
 */
mainTab.panels.delegate(".generateCode", "click", function(){
	dialog.
		show().
		setTitle("生成代码").
		setBody('<form class="dialog_form">\
					<label>代码文件包名</label><input type="text" oninput="var input=$(this);if(input.val()) {input.removeClass(\'not_null\')} else {input.addClass(\'not_null\')}"/>\
					<div class="dialog_buttons">\
						<button type="button" onclick="generateCode($(this));">确定</button>\
						<button type="button" onclick="dialog.close();">取消</button>\
					</div>\
				</form>');
	
	var toolBar = $(this).parents(".tools_bar:first");
	dialog.canvas = toolBar.data("canvas");
	dialog.project = toolBar.data("project");
});

/**
 * 生成代码
 */
mainTab.panels.delegate(".save", "click", function(){
	var toolBar = $(this).parents(".tools_bar:first"),
		canvas = toolBar.data("canvas"),
		projectId = toolBar.data("project").id;
		
	var domainsChart = {
			project:{}
		};
	
	var lines = canvas.getLines(),
		models = canvas.getModels();
		
	domainsChart.id 			= "";
	domainsChart.version 		= "";
	domainsChart.name			= "test";
	domainsChart.project.id 	= projectId;
	domainsChart.lineInfo		= JSON.stringify(lines);
	domainsChart.domainShapeDtos = models;
	
	$.ajax({
		headers: { 
	        'Accept': 'application/json',
	        'Content-Type': 'application/json' 
	    },
		url 	: "domains-chart/save",
		data 	:  JSON.stringify(domainsChart),
		type	: "post",
		dataType : "json",
		success : function(data){
			console.log(data);
		},
		error :function(){
			
		}
	});
});

/*创建工程*/
function createProject(btn){
	var input = btn.parent().prev();
	if(input.val()) {
		$.post('project/create', {"name":input.val()}, function(data){
			if(!isNaN(data)) {
				projectTree.addNodes(null, [{name:input.val(), isParent:true, type:"project", projectId:data.id}]);
				dialog.close();
			} else {
				btn.html("创建失败");
				setTimeout(function(){btn.html('创建')}, 500);
			}
		});
		
		return;
	}
	
	input.addClass("not_null");
};

/*添加建图*/
function addChart(btn){
	var input = btn.parent().prev();
	
	if(input.val()) {
		$.ajax({
		    type:"post",
			url : "domains-chart/create",
			dataType:"json",
			data:{
				"name" : input.val(),
				"projectId" : dialog.projectId
			},
			success : function(data){
				if(!isNaN(data)) {
					console.log([{name:input.val(), id: data, isParent:true, type:"chart", projectId:dialog.projectId}]);
					projectTree.addNodes(projectTree.getSelectedNodes()[0], [{name:input.val(), id: data, isParent:true, type:"chart", projectId:dialog.projectId}]);
					dialog.close();
				} else {
					btn.html("创建失败");
					setTimeout(function(){btn.html('创建')}, 500);
				}
			},
			error:function(){
				alert("添加失败");
			}
		});
		
		return;
	}
	
	input.addClass("not_null");
};

/*生成代码的按钮*/
function generateCode(btn){
	var input = btn.parent().prev();
	if(input.val()){
		var canvas = dialog.canvas;
		var project = dialog.project;
		
		var domainsChart = {
				project:{}
			};
			
		
		var lines = canvas.getLines(),
			models = canvas.getModels();
			
		domainsChart.id 			= "";
		domainsChart.version 		= "";
		domainsChart.name			= "test";
		domainsChart.project.id 	= project.id;
		domainsChart.project.name	= project.name;
		domainsChart.lineInfo		= JSON.stringify(lines);
		domainsChart.domainShapeDtos = models;
		
		$.ajax({
			headers: { 
		        'Accept': 'application/json',
		        'Content-Type': 'application/json' 
		    },
			url 	: "domains-chart/gencode?packageName=" + input.val(),
			data 	:  JSON.stringify(domainsChart),
			type	: "post",
			dataType : "json",
			success : function(data){
				console.log(data);
			},
			error :function(){
				
			}
		});
	}
}
