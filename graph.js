(function () {

    const EXPECTED_DEVICES = 1000

    // const scenarios = [
    //     "ext4_auto_da_alloc_bench", 
    //     "ext4_auto_da_alloc_sync-tmp_bench", 
    //     "ext4_auto_da_alloc_sync-tmpsync-dir_bench",
    //     "ext4_noauto_da_alloc_bench", 
    //     "ext4_noauto_da_alloc_sync-tmp_bench",
    //     "ext4_noauto_da_alloc_sync-tmpsync-dir_bench",
    //     "xfs_bench",
    //     "xfs_sync-tmp_bench",
    //     "xfs_sync-tmpsync-dir_bench",
    // ]

    const scenarios = [
        "ext4_auto_da_alloc_linkunlink_bench",
        "ext4_auto_da_alloc_rename_bench",
        "ext4_noauto_da_alloc_linkunlink_bench",
        "ext4_noauto_da_alloc_rename_bench",
        "xfs_linkunlink_bench",
        "xfs_rename_bench",
    ]

    function convElapsed(val) {
        return Math.round(val / 10000000) / 100
    }

    function flatten(data) {
        let prev = {}
        return data.metrics.map(
            v => {
                let cur = {
                    Elapsed: v.Elapsed,
                    Registry: v.Registry,
                    IO: v.IO,
                    CPU: v.CPU,
                    Mem: v.Mem,
                }

                if (v.CPU !== null) {
                    if (prev.CPU !== undefined) {
                        cur.percentCPU = {
                            user: v.CPU.user - prev.CPU.value.user,
                            system: v.CPU.system - prev.CPU.value.system,
                            idle: v.CPU.idle - prev.CPU.value.idle,
                            nice: v.CPU.nice - prev.CPU.value.nice,
                            iowait: v.CPU.iowait - prev.CPU.value.iowait,
                            irq: v.CPU.irq - prev.CPU.value.irq,
                            softirq: v.CPU.softirq - prev.CPU.value.softirq,
                            steal: v.CPU.steal - prev.CPU.value.steal,
                            guest: v.CPU.guest - prev.CPU.value.guest,
                            guestNice: v.CPU.guestNice - prev.CPU.value.guestNice,
                        }
                        total = cur.percentCPU.user + cur.percentCPU.system + cur.percentCPU.idle + cur.percentCPU.nice + 
                            cur.percentCPU.iowait + cur.percentCPU.irq + cur.percentCPU.softirq + cur.percentCPU.steal + 
                            cur.percentCPU.guest + cur.percentCPU.guestNice
                        cur.percentCPU.user = cur.percentCPU.user / total
                        cur.percentCPU.system = cur.percentCPU.system / total
                        cur.percentCPU.idle = cur.percentCPU.idle / total
                        cur.percentCPU.nice = cur.percentCPU.nice / total
                        cur.percentCPU.iowait = cur.percentCPU.iowait / total
                        cur.percentCPU.irq = cur.percentCPU.irq / total
                        cur.percentCPU.softirq = cur.percentCPU.softirq / total
                        cur.percentCPU.steal = cur.percentCPU.steal / total
                        cur.percentCPU.guest = cur.percentCPU.guest / total
                        cur.percentCPU.guestNice = cur.percentCPU.guestNice / total
                    }
                    prev.CPU = {
                        Elapsed: v.Elapsed,
                        value: v.CPU,
                    }
                }
                if (v.IO !== null) {
                    if (prev.IO !== undefined) {
                        periodMsec = (cur.Elapsed - prev.IO.Elapsed) / 1000000

                        cur.IO.readCount_s = (cur.IO.readCount - prev.IO.value.readCount) / ( periodMsec / 1000)
                        cur.IO.mergedReadCount_s = (cur.IO.mergedReadCount - prev.IO.value.mergedReadCount) / ( periodMsec / 1000)
                        cur.IO.writeCount_s = (cur.IO.writeCount - prev.IO.value.writeCount) / ( periodMsec / 1000)
                        cur.IO.mergedWriteCount_s = (cur.IO.mergedWriteCount - prev.IO.value.mergedWriteCount) / ( periodMsec / 1000)
                        cur.IO.readBytes_s = (cur.IO.readBytes - prev.IO.value.readBytes) / ( periodMsec / 1000)
                        cur.IO.writeBytes_s = (cur.IO.writeBytes - prev.IO.value.writeBytes) / ( periodMsec / 1000)
                        cur.IO.weightedIO_s = (cur.IO.weightedIO - prev.IO.value.weightedIO) / ( periodMsec / 1000)

                        cur.IO.ioTimePercent = (cur.IO.ioTime - prev.IO.value.ioTime) / periodMsec
                        cur.IO.readTimePercent = (cur.IO.readTime - prev.IO.value.readTime) / periodMsec
                        cur.IO.writeTimePercent = (cur.IO.writeTime - prev.IO.value.writeTime) / periodMsec
                   }

                    prev.IO = {
                        Elapsed: v.Elapsed,
                        value: v.IO,
                    }
                }
                if (v.Registry.open != undefined){
                    if (prev.syscall != undefined) {
                        period = cur.Elapsed - prev.syscall.Elapsed
                        cur.syscall = {
                            openTimePercent: (cur.Registry.open.count - prev.syscall.value.open) / period,
                            closeTimePercent: (cur.Registry.close.count - prev.syscall.value.close) / period,
                            writeTimePercent: (cur.Registry.write.count - prev.syscall.value.write) / period,
                            syncTimePercent: (cur.Registry.sync.count - prev.syscall.value.sync) / period,
                            renameTimePercent: (cur.Registry.rename.count - prev.syscall.value.rename) / period,
                            linkTimePercent: (cur.Registry.link.count - prev.syscall.value.link) / period,
                            unlinkTimePercent: (cur.Registry.unlink.count - prev.syscall.value.unlink) / period,
                        }
                    }
                    prev.syscall = {
                        Elapsed: v.Elapsed,
                        value: {
                            open: v.Registry.open.count,
                            close: v.Registry.close.count,
                            write: v.Registry.write.count,
                            sync: v.Registry.sync.count,
                            rename: v.Registry.rename.count,
                            link: v.Registry.link.count,
                            unlink: v.Registry.unlink.count,
                        }
                    }
                }

                return cur
            }
        )
            .map(v => ({
                Elapsed: convElapsed(v.Elapsed),
                writes: v.Registry.writes?.count ?? 0,

                mergedReadCount: v.IO?.mergedReadCount ?? null,
                mergedWriteCount: v.IO?.mergedWriteCount ?? null,
                readCount: v.IO?.readCount ?? null,
                writeCount: v.IO?.writeCount ?? null,
                readBytes: v.IO?.readBytes ?? null,
                writeBytes: v.IO?.writeBytes ?? null,
                weightedIO: v.IO?.weightedIO ?? null,
                readTime: v.IO?.readTime ?? null,
                writeTime: v.IO?.writeTime ?? null,
                iopsInProgress: v.IO?.iopsInProgress ?? null,
                readCount_s: v.IO?.readCount_s ?? null, 
                mergedReadCount_s: v.IO?.mergedReadCount_s ?? null, 
                writeCount_s: v.IO?.writeCount_s ?? null, 
                mergedWriteCount_s: v.IO?.mergedWriteCount_s ?? null, 
                readBytes_s: v.IO?.readBytes_s ?? null, 
                writeBytes_s: v.IO?.writeBytes_s ?? null, 
                weightedIO_s: v.IO?.weightedIO_s ?? null, 
                ioTimePercent: v.IO?.ioTimePercent ?? null, 
                readTimePercent: v.IO?.readTimePercent ?? null, 
                writeTimePercent: v.IO?.writeTimePercent ?? null, 
                cpuIdle: v.CPU?.idle ?? null,
                cpuIowait: v.CPU?.iowait ?? null,
                cpuIrq: v.CPU?.irq ?? null,
                cpuNice: v.CPU?.nice ?? null,
                cpuSoftirq: v.CPU?.softirq ?? null,
                cpuSteal: v.CPU?.steal ?? null,
                cpuSystem: v.CPU?.system ?? null,
                cpuUser: v.CPU?.user ?? null,
                percentCpuIdle: v.percentCPU?.idle ?? null,
                percentCpuIowait: v.percentCPU?.iowait ?? null,
                percentCpuIrq: v.percentCPU?.irq ?? null,
                percentCpuNice: v.percentCPU?.nice ?? null,
                percentCpuSoftirq: v.percentCPU?.softirq ?? null,
                percentCpuSteal: v.percentCPU?.steal ?? null,
                percentCpuSystem: v.percentCPU?.system ?? null,
                percentCpuUser: v.percentCPU?.user ?? null,
                openTimePercent: v.syscall?.openTimePercent ?? null,
                closeTimePercent: v.syscall?.closeTimePercent ?? null,
                writeTimePercent: v.syscall?.writeTimePercent ?? null,
                syncTimePercent: v.syscall?.syncTimePercent ?? null,
                renameTimePercent: v.syscall?.renameTimePercent ?? null,
                linkTimePercent: v.syscall?.linkTimePercent ?? null,
                unlinkTimePercent: v.syscall?.unlinkTimePercent ?? null,
                memTotal: v.Mem?.total ?? null,
                memAvailable: v.Mem?.available ?? null,
                memUsed: v.Mem?.used ?? null,
                memUsedPercent: v.Mem?.usedPercent ?? null,
                memFree: v.Mem?.free ?? null,
                memActive: v.Mem?.active ?? null,
                memInactive: v.Mem?.inactive ?? null,
                memWired: v.Mem?.wired ?? null,
                memLaundry: v.Mem?.laundry ?? null,
                memBuffers: v.Mem?.buffers ?? null,
                memCached: v.Mem?.cached ?? null,
                memWriteback: v.Mem?.writeback ?? null,
                memDirty: v.Mem?.dirty ?? null,
                memWritebacktmp: v.Mem?.writebacktmp ?? null,
                memShared: v.Mem?.shared ?? null,
                memSlab: v.Mem?.slab ?? null,
                memSreclaimable: v.Mem?.sreclaimable ?? null,
                memSunreclaim: v.Mem?.sunreclaim ?? null,
                memPagetables: v.Mem?.pagetables ?? null,
                memSwapcached: v.Mem?.swapcached ?? null,
                memCommitlimit: v.Mem?.commitlimit ?? null,
                memCommittedas: v.Mem?.committedas ?? null,
                memHightotal: v.Mem?.hightotal ?? null,
                memHighfree: v.Mem?.highfree ?? null,
                memLowtotal: v.Mem?.lowtotal ?? null,
                memLowfree: v.Mem?.lowfree ?? null,
                memSwaptotal: v.Mem?.swaptotal ?? null,
                memSwapfree: v.Mem?.swapfree ?? null,
                memMapped: v.Mem?.mapped ?? null,
                memVmalloctotal: v.Mem?.vmalloctotal ?? null,
                memVmallocused: v.Mem?.vmallocused ?? null,
                memVmallocchunk: v.Mem?.vmallocchunk ?? null,
                memHugepagestotal: v.Mem?.hugepagestotal ?? null,
                memHugepagesfree: v.Mem?.hugepagesfree ?? null,
                memHugepagesize: v.Mem?.hugepagesize ?? null,
            }))
    }


    for (let scenario of scenarios) {

        // add divs
        let root = $(`<div id="${scenario}"/>`)
        root.append(`<div class="writes"/>`)
        root.append(`<div class="read_writes_count"/>`)
        root.append(`<div class="write_bytes"/>`)
        root.append(`<div class="cpu"/>`)
        root.append(`<div class="syscalls"/>`)
        root.append(`<div class="mem"/>`)

        $("body").append(root)

        d3.json(`../results/${scenario}.json`, function (data) {
            let flat = flatten(data)
            let markers = data.events.map(v => ({ Elapsed: convElapsed(v.Elapsed), label: v.label }))
            MG.data_graphic({
                title: `Device writes (${scenario})`,
                data: flat,
                markers: markers,
                missing_is_hidden: true,
                width: 800,
                height: 200,
                target: `#${scenario} .writes`,
                x_accessor: 'Elapsed',
                y_accessor: 'writes',
                linked: true,
                interpolate: d3.curveLinear,

            })

            MG.data_graphic({
                title: "Write counts",
                data: flat,
                markers: markers,
                missing_is_hidden: true,
                width: 800,
                height: 200,
                target: `#${scenario} .read_writes_count`,
                x_accessor: 'Elapsed',
                y_accessor: ["writeCount_s", "mergedWriteCount_s", "iopsInProgress"],
                legend: ["w/s", "wrqm/s", "iopsInProgress"],
                aggregate_rollover: true,
                linked: true,
                interpolate: d3.curveLinear,

            })

            MG.data_graphic({
                title: "Write bytes",
                data: flat,
                markers: markers,
                missing_is_hidden: true,
                width: 800,
                height: 200,
                target: `#${scenario} .write_bytes`,
                x_accessor: 'Elapsed',
                y_accessor: "writeBytes_s",
                legend: "B_wrtn/s",
                aggregate_rollover: true,
                linked: true,
                interpolate: d3.curveLinear,
            })

            MG.data_graphic({
                title: "Syscalls",
                data: flat,
                markers: markers,
                missing_is_hidden: true,
                width: 800,
                height: 200,
                target: `#${scenario} .syscalls`,
                x_accessor: 'Elapsed',
                y_accessor: ["openTimePercent", "closeTimePercent", "writeTimePercent", "syncTimePercent", "renameTimePercent", "linkTimePercent", "unlinkTimePercent",],
                legend: ["open", "close", "write", "sync", "rename", "link", "unlink"],
                aggregate_rollover: true,
                linked: true,
                interpolate: d3.curveLinear,
                format: 'percentage',
            })            
            
            MG.data_graphic({
                title: "CPU",
                data: flat,
                markers: markers,
                missing_is_hidden: true,
                width: 800,
                height: 300,
                target: `#${scenario} .cpu`,
                x_accessor: 'Elapsed',
                y_accessor: [
                    "percentCpuIdle",
                    "percentCpuIowait",
                    // "percentCpuIrq",
                    // "percentCpuNice",
                    "percentCpuSoftirq",
                    "percentCpuSteal",
                    "percentCpuSystem",
                    "percentCpuUser",
                ],
                legend: [
                    "idle",
                    "iowait",
                    // "CpuIrq",
                    // "CpuNice",
                    "softirq",
                    "steal",
                    "system",
                    "user",
                ],
                aggregate_rollover: true,
                linked: true,
                interpolate: d3.curveLinear,
                format: 'percentage',
            })

            MG.data_graphic({
                title: "Mem",
                data: flat,
                markers: markers,
                missing_is_hidden: true,
                width: 800,
                height: 300,
                target: `#${scenario} .mem`,
                x_accessor: 'Elapsed',
                y_accessor: [
                    // "memTotal",
                    // "memAvailable",
                    // "memUsed",
                    // "memUsedPercent",
                    // "memFree",
                    // "memActive",
                    // "memInactive",
                    // "memWired",
                    // "memLaundry",
                    // "memBuffers",
                    "memCached",
                    // "memWriteback",
                    "memDirty",
                    // "memWritebacktmp",
                    // "memShared",
                    // "memSlab",
                    // "memSreclaimable",
                    // "memSunreclaim",
                    // "memPagetables",
                    // "memSwapcached",
                    // "memCommitlimit",
                    // "memCommittedas",
                    // "memHightotal",
                    // "memHighfree",
                    // "memLowtotal",
                    // "memLowfree",
                    // "memSwaptotal",
                    // "memSwapfree",
                    // "memMapped",
                    // "memVmalloctotal",
                    // "memVmallocused",
                    // "memVmallocchunk",
                    // "memHugepagestotal",
                    // "memHugepagesfree",
                    // "memHugepagesize",
                ],
                legend: [
                    // "Total",
                    // "Available",
                    // "Used",
                    // "UsedPercent",
                    // "Free",
                    // "Active",
                    // "Inactive",
                    // "Wired",
                    // "Laundry",
                    // "Buffers",
                    "Cached",
                    // "Writeback",
                    "Dirty",
                    // "Writebacktmp",
                    // "Shared",
                    // "Slab",
                    // "Sreclaimable",
                    // "Sunreclaim",
                    // "Pagetables",
                    // "Swapcached",
                    // "Commitlimit",
                    // "Committedas",
                    // "Hightotal",
                    // "Highfree",
                    // "Lowtotal",
                    // "Lowfree",
                    // "Swaptotal",
                    // "Swapfree",
                    // "Mapped",
                    // "Vmalloctotal",
                    // "Vmallocused",
                    // "Vmallocchunk",
                    // "Hugepagestotal",
                    // "Hugepagesfree",
                    // "Hugepagesize",
                ],
                aggregate_rollover: true,
                linked: true,
                interpolate: d3.curveLinear,
            })

        })
    }
})()


