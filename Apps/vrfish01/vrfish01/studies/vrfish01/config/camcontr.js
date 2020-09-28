var IWM = IWM || {};
IWM.conditionconfig =
    {
        "conditionid": "camcontr",
        "title": "camcontr",
        "description": "Eine vrfish01-Bedingung.",
        "language": "DE",
        "progressmaxpagecount": null,
        "pages":
            [
                //
                { "pageid": "start", "src": "start.html", "nextid": "vrcheck_instr", "first": true, "layout": "iwmgrey_flex" },

                //vrcheck
                { "pageid": "vrcheck_instr", "src": "vrcheck/vrcheck_instr.html", "nextid": "vrcheck", "layout": "iwmgrey_flex", "backallowed": false },                
                { "pageid": "vrcheck", "src": "vrcheck/vrcheck.html", "nextid": "pretest_instr", "layout": "allblack_flex", "backallowed": false, "nextallowed": false },
                { "pageid": "abort", "src": "vrcheck/abort.html", "nextallowed": false, "layout": "iwmgrey_flex", "backallowed": false },

                //pretest
                { "pageid": "pretest_instr", "src": "pretest/pretest_instr.html", "nextid": "pretest_dem01", "layout": "iwmgrey_flex", "backallowed": false },
                { "pageid": "pretest_dem01", "src": "pretest/pretest_dem01.html", "nextid": "pretest_dem02", "layout": "iwmgrey_flex", "backallowed": false },
                { "pageid": "pretest_dem02", "src": "pretest/pretest_dem02.html", "nextid": "pretest_fish01", "layout": "iwmgrey_flex", "backallowed": false },
                { "pageid": "pretest_fish01", "src": "pretest/pretest_fish01.html", "nextid": "pretest_fish02", "layout": "iwmgrey_flex", "backallowed": false },
                { "pageid": "pretest_fish02", "src": "pretest/pretest_fish02.html", "nextid": "pretest_fish03", "layout": "iwmgrey_flex", "backallowed": false },
                { "pageid": "pretest_fish03", "src": "pretest/pretest_fish03.html", "nextid": "pretest_fish04", "layout": "iwmgrey_flex", "backallowed": false },
                { "pageid": "pretest_fish04", "src": "pretest/pretest_fish04.html", "nextid": "pretest_vr01", "layout": "iwmgrey_flex", "backallowed": false }, 
                { "pageid": "pretest_vr01", "src": "pretest/pretest_vr01.html", "nextid": "pretest_mouse01", "layout": "iwmgrey_flex", "backallowed": false },  
                { "pageid": "pretest_mouse01", "src": "pretest/pretest_mouse01.html", "nextid": "pft_instr01", "layout": "iwmgrey_flex", "backallowed": false },             
                
                //pft
                { "pageid": "pft_instr01", "src": "pft/pft_instr01.html", "nextid": "pft_instr02", "layout": "iwmgrey_flex", "backallowed": false },
                { "pageid": "pft_instr02", "src": "pft/pft_instr02.html", "nextid": "pft_task", "layout": "iwmgrey_flex", "backallowed": false },
                { "pageid": "pft_task", "src": "pft/pft_task.html", "nextid": "pft_end", "layout": "iwmgrey_flex", "backallowed": false, "maxtime": 180 },
                { "pageid": "pft_end", "src": "pft/pft_end.html", "nextid": "learn_instr01", "layout": "iwmgrey_flex", "backallowed": false },
                
                //learn
                { "pageid": "learn_instr01", "src": "learn/learn_instr01_cc.html", "nextid": "pract_instr01", "layout": "iwmgrey_flex", "backallowed": false },  
                { "pageid": "pract_instr01", "src": "learn/pract_instr01_cc.html", "nextid": "vr", "layout": "iwmgrey_flex", "backallowed": false },               
                { "pageid": "vr", "src": "learn/vr.html", "nextid": "quest_mosick01", "layout": "allblack_flex", "backallowed": false, "nextallowed": false, "controlsvisible": false },
                { "pageid": "quest_mosick01", "src": "learn/quest_mosick01.html", "nextid": "quest_mosick02", "layout": "iwmgrey_flex", "backallowed": false },
                { "pageid": "quest_mosick02", "src": "learn/quest_mosick02.html", "nextid": "quest_coglearn01", "layout": "iwmgrey_flex", "backallowed": false },                
                { "pageid": "quest_coglearn01", "src": "learn/quest_coglearn01.html", "nextid": "quest_coglearn02", "layout": "iwmgrey_flex", "backallowed": false },
                { "pageid": "quest_coglearn02", "src": "learn/quest_coglearn02.html", "nextid": "quest_coglearn03", "layout": "iwmgrey_flex", "backallowed": false },
                { "pageid": "quest_coglearn03", "src": "learn/quest_coglearn03.html", "nextid": "test_video_instr01", "layout": "iwmgrey_flex", "backallowed": false },

                //test
                { "pageid": "test_video_instr01", "src": "test/test_video_instr01.html", "nextid": "test_video_instr02", "layout": "iwmgrey_flex", "backallowed": false },
                { "pageid": "test_video_instr02", "src": "test/test_video_instr02.html", "nextid": "test_video", "layout": "iwmgrey_flex", "backallowed": false },
                { "pageid": "test_video", "src": "test/test_video.html", "nextid": "test_know_instr", "layout": "iwmgrey_flex", "backallowed": false },
                { "pageid": "test_know_instr", "src": "test/test_know_instr.html", "nextid": "test_know", "layout": "iwmgrey_flex", "backallowed": false },
                { "pageid": "test_know", "src": "test/test_know.html", "nextid": "quest_cogtest", "layout": "iwmgrey_flex", "backallowed": false },
                { "pageid": "quest_cogtest", "src": "test/quest_cogtest.html", "nextid": "quest_exp01", "layout": "iwmgrey_flex", "backallowed": false },
                { "pageid": "quest_exp01", "src": "test/quest_exp01.html", "nextid": "quest_inter", "layout": "iwmgrey_flex", "backallowed": false },
                { "pageid": "quest_inter", "src": "test/quest_inter_cc.html", "nextid": "quest_exp02", "layout": "iwmgrey_flex", "backallowed": false },
                { "pageid": "quest_exp02", "src": "test/quest_exp02.html", "nextid": "quest_com", "layout": "iwmgrey_flex", "backallowed": false },
                { "pageid": "quest_com", "src": "test/quest_com.html", "nextid": "studyinf", "layout": "iwmgrey_flex", "backallowed": false },
                
                //
                { "pageid": "studyinf", "src": "studyinf.html", "nextid": "withdraw", "layout": "iwmgrey_flex", "backallowed": false },
                { "pageid": "withdraw", "src": "withdraw.html", "nextid": "end", "layout": "iwmgrey_flex", "backallowed": false },
                { "pageid": "end", "src": "end.html", "nextallowed": false, "layout": "iwmgrey_flex", "backallowed": false }
            ],
        "pagegroups": [ ]
    }